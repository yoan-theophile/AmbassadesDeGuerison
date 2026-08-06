import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getPublicMapPhotoUrls } from '@/lib/storage/photo-url';

// Polling 30s depuis la carte publique
export const revalidate = 0;

export async function GET() {
  const supabase = createServiceClient();

  const now = new Date();
  const nowISO = now.toISOString();
  const windowHours = Number(process.env.NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS ?? 4);
  const windowStart = new Date(now.getTime() - windowHours * 3_600_000).toISOString();

  // Priorité : live en cours (non clôturé) → prochain event → dernier event passé (carte vide)
  let referenceEvent =
    (await supabase.from('events').select('id')
      .lte('event_date', nowISO).gte('event_date', windowStart).is('closed_at', null)
      .order('event_date', { ascending: false }).limit(1).maybeSingle()).data ??
    (await supabase.from('events').select('id')
      .gt('event_date', nowISO)
      .order('event_date', { ascending: true }).limit(1).maybeSingle()).data ??
    (await supabase.from('events').select('id')
      .lte('event_date', nowISO)
      .order('event_date', { ascending: false }).limit(1).maybeSingle()).data;

  if (!referenceEvent) {
    return NextResponse.json([]);
  }

  const lastEvent = referenceEvent;

  const { data, error } = await supabase
    .from('host_activations')
    .select(`
      id, is_active, is_full, capacity, accepted_count,
      host_profiles!inner (
        id, first_name, city, country, lat, lng,
        whatsapp_group_url, geocoding_failed, host_type, quartier, is_women_only,
        presentation_message, profile_photo_url
      )
    `)
    .eq('event_id', lastEvent.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).filter((a) => {
    const hp = a.host_profiles as any;
    return hp && hp.lat && hp.lng && !hp.geocoding_failed;
  });

  // Signed URLs uniquement pour les hôtes actifs (photo affichée en popup,
  // jamais sur le pin) — pas de coût de signature pour les pins grisés.
  const activePhotoPaths = rows
    .filter((a) => a.is_active)
    .map((a) => (a.host_profiles as any).profile_photo_url)
    .filter(Boolean);
  const photoUrls = await getPublicMapPhotoUrls(activePhotoPaths);

  const pins = rows.map((a) => {
    const hp = a.host_profiles as any;
    return {
      id: hp.id,
      first_name: hp.first_name,
      city: hp.city,
      country: hp.country,
      lat: hp.lat,
      lng: hp.lng,
      is_active: a.is_active,
      is_full: a.is_full,
      accepted_count: a.accepted_count,
      capacity: a.capacity,
      whatsapp_group_url: hp.whatsapp_group_url ?? null,
      host_type: hp.host_type ?? 'domicile',
      quartier: hp.quartier ?? null,
      presentation_message: hp.presentation_message ?? null,
      is_women_only: hp.is_women_only ?? false,
      photo_url: a.is_active && hp.profile_photo_url ? (photoUrls[hp.profile_photo_url] ?? null) : null,
      activation_id: a.id,
    };
  });

  return NextResponse.json(pins);
}
