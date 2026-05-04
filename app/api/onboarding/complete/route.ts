import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';

const ADVANCED_STATUSES = ['pre_approved', 'enrichment_pending', 'validated'];

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
    .select('id, status')
    .eq('user_id', user.id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
  }

  if (ADVANCED_STATUSES.includes(profile.status)) {
    return NextResponse.json({ success: true, status: profile.status });
  }

  if (profile.status !== 'pending_review') {
    return NextResponse.json(
      { error: 'Statut incompatible avec cette action.' },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from('host_profiles')
    .update({ status: 'pre_approved' })
    .eq('id', profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log(JSON.stringify({
    event: 'onboarding_complete',
    user_id: user.id,
    profile_id: profile.id,
    from: 'pending_review',
    to: 'pre_approved',
    ts: new Date().toISOString(),
  }));

  return NextResponse.json({ success: true, status: 'pre_approved' });
}
