import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const visible = searchParams.get('is_visible');

  let query = supabase
    .from('testimonials')
    .select(`
      id, content, timing, created_at, visitor_name,
      host_profiles (id, first_name, city, country)
    `)
    .order('created_at', { ascending: false });

  if (eventId) query = query.eq('event_id', eventId);
  if (visible !== null) query = query.eq('is_visible', visible === 'true');

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();
  const { host_profile_id, contact_request_id, visitor_name, event_id, timing, content } = body;

  if (!event_id || !content?.trim()) {
    return NextResponse.json({ error: 'event_id et content sont requis.' }, { status: 400 });
  }
  if (!host_profile_id && !contact_request_id) {
    return NextResponse.json({ error: 'host_profile_id ou contact_request_id est requis.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('testimonials')
    .insert({
      host_profile_id: host_profile_id ?? null,
      contact_request_id: contact_request_id ?? null,
      visitor_name: visitor_name?.trim() || null,
      event_id,
      timing: timing ?? 'after',
      content: content.trim(),
      is_visible: false,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
