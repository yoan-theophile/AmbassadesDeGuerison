import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Polling 30s depuis la carte publique
export const revalidate = 0;

export async function GET() {
  const supabase = createServiceClient();

  // "Dernier live" = event passé le plus récent (stable même si un event futur est créé)
  const { data: lastEvent } = await supabase
    .from('events')
    .select('id')
    .lte('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (!lastEvent) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from('host_activations')
    .select(`
      id, is_active, is_full, capacity, accepted_count,
      host_profiles!inner (
        id, first_name, city, country, lat, lng,
        contact_mode, whatsapp_group_url, geocoding_failed, host_type
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
        activation_id: a.id,
      };
    });

  return NextResponse.json(pins);
}
