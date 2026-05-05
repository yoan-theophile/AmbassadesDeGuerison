import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Polling 30s depuis la carte publique
export const revalidate = 0;

export async function GET() {
  const supabase = createServiceClient();

  const now = new Date();
  const nowISO = now.toISOString();
  const windowHours = Number(process.env.NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS ?? 4);
  const windowStart = new Date(now.getTime() - windowHours * 3_600_000).toISOString();

  // Priorité : live en cours → prochain event → dernier event passé (carte vide)
  let referenceEvent =
    (await supabase.from('events').select('id')
      .lte('event_date', nowISO).gte('event_date', windowStart)
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
        contact_mode, whatsapp_group_url, geocoding_failed, host_type, quartier
      )
    `)
    .eq('event_id', lastEvent.id)
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pins = (data ?? [])
    .filter((a) => {
      const hp = a.host_profiles as any;
      return hp && hp.lat && hp.lng && !hp.geocoding_failed;
    })
    .map((a) => {
      const hp = a.host_profiles as any;
      return {
        id: hp.id,
        first_name: hp.first_name,
        city: hp.city,
        country: hp.country,
        lat: hp.lat,
        lng: hp.lng,
        contact_mode: hp.contact_mode,
        is_full: a.is_full,
        accepted_count: a.accepted_count,
        capacity: a.capacity,
        whatsapp_group_url: hp.whatsapp_group_url ?? null,
        host_type: hp.host_type ?? 'domicile',
        quartier: hp.quartier ?? null,
        activation_id: a.id,
      };
    });

  return NextResponse.json(pins);
}
