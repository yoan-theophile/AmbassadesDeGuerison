import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Polling 5s depuis l'admin feed
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'pending';
  const eventId = searchParams.get('event_id');

  let query = supabase
    .from('live_signals')
    .select(`
      id, description, status, link_shared, created_at,
      host_profiles!inner (id, first_name, city, country)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();
  const { host_profile_id, event_id, description } = body;

  if (!host_profile_id || !event_id || !description?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('live_signals')
    .insert({ host_profile_id, event_id, description: description.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
