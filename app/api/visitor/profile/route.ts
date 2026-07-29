import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';

function getAnonClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
}

export async function GET(req: NextRequest) {
  const { data: { user } } = await getAnonClient(req).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from('visitor_profiles')
    .select('first_name, email, phone, photo_url')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const { data: { user } } = await getAnonClient(req).auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const phone = (body as { phone?: unknown }).phone;
  if (phone !== undefined && typeof phone !== 'string') {
    return NextResponse.json({ error: 'Téléphone invalide' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('visitor_profiles')
    .update({ phone: phone || null })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
