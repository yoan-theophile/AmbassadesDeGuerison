import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthHostProfileId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return null;

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('host_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'validated')
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  // Honeypot
  if (body.website) return NextResponse.json({}, { status: 200 });

  const { event_id, content, submitter_name, submitter_city } = body as {
    event_id?: string;
    content?: string;
    submitter_name?: string;
    submitter_city?: string;
  };

  if (!event_id || typeof event_id !== 'string') {
    return NextResponse.json({ error: 'event_id est requis.' }, { status: 400 });
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Le témoignage ne peut pas être vide.' }, { status: 400 });
  }
  if (content.trim().length > 2000) {
    return NextResponse.json({ error: 'Le témoignage ne peut pas dépasser 2000 caractères.' }, { status: 400 });
  }

  const hostProfileId = await getAuthHostProfileId();

  const { data, error } = await supabase
    .from('testimonials')
    .insert({
      event_id,
      content: content.trim(),
      visitor_name: hostProfileId ? null : (typeof submitter_name === 'string' ? submitter_name.trim() || null : null),
      submitter_city: hostProfileId ? null : (typeof submitter_city === 'string' ? submitter_city.trim() || null : null),
      is_visible: false,
      host_profile_id: hostProfileId,
      contact_request_id: null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, linked: !!hostProfileId }, { status: 201 });
}
