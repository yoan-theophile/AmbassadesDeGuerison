import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Honeypot — bots fill the hidden "website" field
  if (body.website) return NextResponse.json({}, { status: 200 });

  const { event_id, host_profile_id, first_name, email, phone, nb_personnes, message, consent } = body;

  if (!event_id || !host_profile_id || !first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: 'Consentement requis' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const emailLower = email.trim().toLowerCase();
  const phoneTrimmed = phone?.trim() || null;

  // Blacklist — silent 201 pour éviter l'énumération
  const blacklistFilter = phoneTrimmed
    ? `email.eq.${emailLower},phone.eq.${phoneTrimmed}`
    : `email.eq.${emailLower}`;
  const { data: blocked } = await supabase
    .from('blacklist')
    .select('id')
    .or(blacklistFilter)
    .limit(1)
    .maybeSingle();
  if (blocked) {
    return NextResponse.json({ status: 'pending' }, { status: 201 });
  }

  // Vérifier la fenêtre d'inscription de l'event
  const now = new Date().toISOString();
  const { data: event } = await supabase
    .from('events')
    .select('id, registration_opens_at, registration_closes_at')
    .eq('id', event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
  }
  if (event.registration_opens_at && now < event.registration_opens_at) {
    return NextResponse.json({ error: 'Les inscriptions ne sont pas encore ouvertes' }, { status: 400 });
  }
  if (event.registration_closes_at && now > event.registration_closes_at) {
    return NextResponse.json({ error: 'Les inscriptions sont fermées' }, { status: 400 });
  }

  // Vérifier que l'ambassade est activée pour ce live
  const { data: act } = await supabase
    .from('host_activations')
    .select('id, is_active, is_full')
    .eq('host_profile_id', host_profile_id)
    .eq('event_id', event_id)
    .maybeSingle();

  if (!act) {
    return NextResponse.json({ error: "Ambassade non disponible pour ce live" }, { status: 404 });
  }
  if (!act.is_active) {
    return NextResponse.json({ error: "Cette ambassade n'a pas encore ouvert ses portes pour ce live" }, { status: 410 });
  }
  if (act.is_full) {
    return NextResponse.json({ error: 'Cette ambassade est complète' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      host_activation_id: act.id,
      visitor_first_name: first_name.trim(),
      visitor_email: emailLower,
      visitor_phone: phoneTrimmed,
      nb_personnes: Math.max(1, parseInt(String(nb_personnes)) || 1),
      visitor_message: message?.trim() || null,
    })
    .select('id, action_token')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Vous avez déjà fait une demande pour cette ambassade' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, action_token: data.action_token }, { status: 201 });
}
