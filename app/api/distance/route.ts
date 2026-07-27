import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { haversineKm } from '@/lib/geo/distance';

const MAX_HOST_IDS = 20;

// Calcule la distance visiteur↔ambassadeur côté serveur — ne renvoie JAMAIS
// de coordonnées, seulement une distance arrondie au km. La position visiteur
// est reçue une fois (POST), utilisée pour ce calcul, jamais persistée.
// Rate-limité dans proxy.ts (mitigation triangulation, cf /plan-eng-review).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });

  const { lat, lng, host_ids } = body as { lat?: unknown; lng?: unknown; host_ids?: unknown };

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isNaN(latNum) || latNum < -90 || latNum > 90) {
    return NextResponse.json({ error: 'Latitude invalide' }, { status: 400 });
  }
  if (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    return NextResponse.json({ error: 'Longitude invalide' }, { status: 400 });
  }
  if (!Array.isArray(host_ids) || host_ids.length === 0) {
    return NextResponse.json({ error: 'host_ids requis' }, { status: 400 });
  }
  if (host_ids.length > MAX_HOST_IDS) {
    return NextResponse.json({ error: `Maximum ${MAX_HOST_IDS} ambassades par requête` }, { status: 400 });
  }
  if (!host_ids.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'host_ids doit être un tableau de chaînes' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('host_profiles')
    .select('id, lat_precise, lng_precise')
    .in('id', host_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: Record<string, number | null> = {};
  for (const id of host_ids) {
    const hp = data?.find((h) => h.id === id);
    result[id] = hp?.lat_precise != null && hp?.lng_precise != null
      ? haversineKm(latNum, lngNum, hp.lat_precise, hp.lng_precise)
      : null;
  }

  return NextResponse.json(result);
}
