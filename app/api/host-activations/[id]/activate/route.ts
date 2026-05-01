import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  const { id: event_id } = await params;
  const body = await req.json();
  const capacity = parseInt(String(body.capacity));

  if (!capacity || capacity < 1) {
    return NextResponse.json({ error: 'Capacité invalide' }, { status: 400 });
  }

  // Auth via session cookie — hôte doit être connecté
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
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Vérifier que l'hôte est validé
  const { data: profile } = await supabase
    .from('host_profiles')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'Profil ambassadeur introuvable' }, { status: 404 });
  }
  if (profile.status !== 'validated') {
    return NextResponse.json({ error: 'Ambassade non validée' }, { status: 403 });
  }

  // Vérifier que l'event est futur
  const now = new Date().toISOString();
  const { data: event } = await supabase
    .from('events')
    .select('id, event_date')
    .eq('id', event_id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
  }
  if (event.event_date < now) {
    return NextResponse.json({ error: 'Cet événement est déjà passé' }, { status: 400 });
  }

  // UPDATE atomique — idempotent (clic 2x = no-op)
  const { error } = await supabase
    .from('host_activations')
    .update({ is_active: true, capacity })
    .eq('host_profile_id', profile.id)
    .eq('event_id', event_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
