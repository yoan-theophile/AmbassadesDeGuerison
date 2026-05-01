import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { sendNouvelleActivationAdmin, sendBienvenueAmbassadeur } from '@/lib/email/templates';
import { FEATURES } from '@/config/features';

export async function PATCH(req: NextRequest) {
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: profile, error: fetchError } = await supabase
    .from('host_profiles')
    .select('id, status, first_name, email, city, country')
    .eq('user_id', user.id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
  }

  if (profile.status === 'validated') {
    return NextResponse.json({ success: true });
  }

  if (profile.status !== 'pending_review') {
    return NextResponse.json({ error: 'Statut incompatible avec cette action.' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('host_profiles')
    .update({ status: 'validated' })
    .eq('id', profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (FEATURES.EMAIL_NOTIFICATIONS) {
    sendNouvelleActivationAdmin(profile.first_name, profile.city, profile.country).catch(() => {});
    sendBienvenueAmbassadeur(profile.email, profile.first_name).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
