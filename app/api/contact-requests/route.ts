import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendContactRequestReserved, sendNewContactRequestHost } from '@/lib/email/templates';
import { FEATURES } from '@/config/features';

const DELAY_HOURS = 24;

// DEPRECATED: utiliser POST /api/visit-requests qui exige event_id explicite
// Cette route utilise "dernier live" comme fallback — problématique si deux lives proches
// Conservée pour les anciens liens tokenisés uniquement. Ne pas appeler depuis le nouvel UI.
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();
  const {
    host_profile_id,
    visitor_first_name,
    visitor_email,
    visitor_whatsapp,
    visitor_message,
  } = body;

  if (!visitor_first_name?.trim() || !visitor_email?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  // Résoudre l'activation via le dernier live
  const { data: lastEvent } = await supabase
    .from('events')
    .select('id')
    .lte('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (!lastEvent) {
    return NextResponse.json({ error: 'Aucun live en cours' }, { status: 404 });
  }

  const { data: act } = await supabase
    .from('host_activations')
    .select('id, is_active, is_full, capacity, accepted_count')
    .eq('host_profile_id', host_profile_id)
    .eq('event_id', lastEvent.id)
    .single();

  if (!act) {
    return NextResponse.json({ error: 'Ambassade non activée pour ce live' }, { status: 404 });
  }
  if (!act.is_active) {
    return NextResponse.json({ error: 'Ambassade non disponible' }, { status: 410 });
  }
  if (act.is_full) {
    return NextResponse.json({ error: 'Ambassade complète' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      host_activation_id: act.id,
      visitor_first_name: visitor_first_name.trim(),
      visitor_email: visitor_email.trim().toLowerCase(),
      visitor_whatsapp: visitor_whatsapp?.trim() || null,
      visitor_message: visitor_message?.trim() || null,
    })
    .select('id, action_token, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Demande déjà envoyée' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch host details for emails
  const { data: hostDetails } = await supabase
    .from('host_profiles')
    .select('email, first_name, city, whatsapp_group_url')
    .eq('id', host_profile_id)
    .single();

  if (hostDetails && FEATURES.EMAIL_NOTIFICATIONS) {
    const accueilUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accueil-invite/${data.action_token}`;
    const declineUrl = `${process.env.NEXT_PUBLIC_APP_URL}/refuser/${data.action_token}`;
    const availableAt = new Date(new Date(data.created_at).getTime() + DELAY_HOURS * 60 * 60 * 1000);

    Promise.allSettled([
      sendContactRequestReserved(
        visitor_email.trim(),
        visitor_first_name.trim(),
        hostDetails.first_name,
        hostDetails.city,
        hostDetails.email,
        hostDetails.whatsapp_group_url ?? null,
        accueilUrl,
        availableAt
      ),
      sendNewContactRequestHost(
        hostDetails.email,
        hostDetails.first_name,
        visitor_first_name.trim(),
        visitor_email.trim(),
        visitor_whatsapp?.trim() || null,
        visitor_message?.trim() || null,
        declineUrl
      ),
    ]);
  }

  return NextResponse.json({ id: data.id, action_token: data.action_token }, { status: 201 });
}
