import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const { event_id, type, scheduled_at, custom_message } = body;

  if (!event_id || !type || !scheduled_at) {
    return NextResponse.json({ error: 'event_id, type et scheduled_at sont requis' }, { status: 400 });
  }
  if (!['ambassadeurs', 'visiteurs'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }

  const { supabase } = ctx;

  // Vérifier que l'event existe et est futur
  const { data: event } = await supabase
    .from('events')
    .select('id, event_date')
    .eq('id', event_id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
  }
  if (new Date(event.event_date) <= new Date()) {
    return NextResponse.json({ error: 'Événement déjà passé' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('scheduled_campaigns')
    .insert({
      event_id,
      type,
      scheduled_at: new Date(scheduled_at).toISOString(),
      custom_message: custom_message?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
