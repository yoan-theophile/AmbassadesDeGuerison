import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();
  const { host_activation_id: rawActivationId, host_profile_id, visitor_first_name, visitor_email, visitor_message } = body;

  if (!visitor_first_name?.trim() || !visitor_email?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  let host_activation_id = rawActivationId;

  // Si host_profile_id fourni (pas host_activation_id), résoudre via le dernier live
  if (!host_activation_id && host_profile_id) {
    const { data: lastEvent } = await supabase
      .from('events')
      .select('id')
      .lte('event_date', new Date().toISOString())
      .order('event_date', { ascending: false })
      .limit(1)
      .single();

    if (!lastEvent) return NextResponse.json({ error: 'Aucun live en cours' }, { status: 404 });

    const { data: act } = await supabase
      .from('host_activations')
      .select('id')
      .eq('host_profile_id', host_profile_id)
      .eq('event_id', lastEvent.id)
      .single();

    if (!act) return NextResponse.json({ error: 'Ambassade non activée pour ce live' }, { status: 404 });
    host_activation_id = act.id;
  }

  if (!host_activation_id) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  // Vérifie que l'activation est active et non complète
  const { data: activation } = await supabase
    .from('host_activations')
    .select('id, is_active, is_full')
    .eq('id', host_activation_id)
    .single();

  if (!activation || !activation.is_active) {
    return NextResponse.json({ error: 'Ambassade non disponible' }, { status: 410 });
  }
  if (activation.is_full) {
    return NextResponse.json({ error: 'Ambassade complète' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      host_activation_id,
      visitor_first_name: visitor_first_name.trim(),
      visitor_email: visitor_email.trim().toLowerCase(),
      visitor_message: visitor_message?.trim() ?? null,
    })
    .select('id, action_token')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Demande déjà envoyée' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
