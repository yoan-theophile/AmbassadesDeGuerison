import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { FEATURES } from '@/config/features';
import { sendEnrichissementRecu } from '@/lib/email/templates';

export async function PATCH(req: NextRequest) {
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from('host_profiles')
    .select('id, status, first_name, profile_photo_url, room_photo_urls')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
  if (profile.status !== 'pre_approved') {
    return NextResponse.json(
      { error: 'Le questionnaire n\'est accessible que pour les candidats pré-approuvés' },
      { status: 403 }
    );
  }

  // Vérifier qu'une photo de profil a bien été uploadée avant soumission
  if (!profile.profile_photo_url) {
    return NextResponse.json(
      { error: 'Une photo de profil est requise pour soumettre votre profil.' },
      { status: 400 }
    );
  }

  // Vérifier qu'au moins une photo du lieu a bien été uploadée avant soumission
  if (!profile.room_photo_urls || profile.room_photo_urls.length === 0) {
    return NextResponse.json(
      { error: 'Au moins une photo du lieu d\'accueil est requise pour soumettre votre profil.' },
      { status: 400 }
    );
  }

  const body = await req.json();
  const {
    healing_challenge_done,
    church_attendance,
    denomination,
    parcours_spirituel,
    livres_lus,
    conferences_assistees,
  } = body;

  const updates: Record<string, unknown> = { status: 'enrichment_pending' };
  if (typeof healing_challenge_done === 'boolean') updates.healing_challenge_done = healing_challenge_done;
  if (church_attendance !== undefined) updates.church_attendance = church_attendance;
  if (denomination !== undefined) updates.denomination = denomination;
  if (parcours_spirituel !== undefined) updates.parcours_spirituel = parcours_spirituel;
  if (livres_lus !== undefined) updates.livres_lus = livres_lus;
  if (typeof conferences_assistees === 'boolean') updates.conferences_assistees = conferences_assistees;

  const { error } = await supabase
    .from('host_profiles')
    .update(updates)
    .eq('id', profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (FEATURES.EMAIL_NOTIFICATIONS) {
    const adminEmail = process.env.RESEND_ADMIN_EMAIL;
    if (adminEmail) {
      Promise.allSettled([
        sendEnrichissementRecu(adminEmail, profile.first_name),
      ]);
    }
  }

  return NextResponse.json({ success: true });
}
