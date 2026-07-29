import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';

// Signalement manuel d'une photo visiteur depuis le dashboard ambassadeur
// (pas de modération IA, hors scope — cf /plan-eng-review, modèle d'abus
// minimal). L'admin peut ensuite consulter les profils visiteurs signalés
// via `SELECT * FROM visitor_profiles WHERE photo_reported = true` — pas de
// nouvelle page admin dédiée pour l'instant, la volumétrie attendue est
// faible (phase de conception).
export async function POST(req: NextRequest) {
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const contactRequestId = (body as { contact_request_id?: unknown }).contact_request_id;
  if (typeof contactRequestId !== 'string') {
    return NextResponse.json({ error: 'contact_request_id requis' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: hostProfile } = await supabase
    .from('host_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!hostProfile) return NextResponse.json({ error: 'Profil ambassadeur introuvable' }, { status: 404 });

  const { data: row } = await supabase
    .from('contact_requests')
    .select('visitor_profile_id, host_activations!inner(host_profile_id)')
    .eq('id', contactRequestId)
    .eq('host_activations.host_profile_id', hostProfile.id)
    .maybeSingle();

  if (!row?.visitor_profile_id) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  const { error } = await supabase
    .from('visitor_profiles')
    .update({ photo_reported: true })
    .eq('id', row.visitor_profile_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
