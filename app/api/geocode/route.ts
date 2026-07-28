import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ambassades-guerison.fr';

// Quartier/arrondissement — priorité à ce qui identifie le mieux une zone
// dans une grande ville (Paris/Lyon/Marseille ont des city_district), avec
// repli sur suburb/neighbourhood pour les autres villes.
function extractQuartier(addr: Record<string, string | undefined>): string | undefined {
  return addr.city_district ?? addr.suburb ?? addr.neighbourhood ?? addr.quarter;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const mode = req.nextUrl.searchParams.get('mode'); // 'address' — Phase 2 (adresse précise ambassadeur)
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '6',
    addressdetails: '1',
  });
  if (mode !== 'address') {
    params.set('featuretype', 'city');
  }

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      'User-Agent': `AmbassadesGuerison/1.0 (+${APP_URL})`,
      'Accept-Language': 'fr',
    },
    next: { revalidate: 60 },
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json([]);

  const raw: any[] = await res.json();

  if (mode === 'address') {
    const results = raw
      .filter((r) => r.lat && r.lon)
      .map((r) => {
        const addr = r.address ?? {};
        const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '';
        const country = addr.country ?? '';
        return {
          label: r.display_name as string,
          address: r.display_name as string,
          city,
          country,
          quartier: extractQuartier(addr) ?? null,
          lat_precise: parseFloat(r.lat),
          lng_precise: parseFloat(r.lon),
        };
      });
    return NextResponse.json(results);
  }

  const seen = new Set<string>();
  const results = raw
    .filter((r) => r.lat && r.lon)
    .map((r) => {
      const addr = r.address ?? {};
      const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? r.display_name.split(',')[0];
      const country = addr.country ?? '';
      return {
        label: [city, country].filter(Boolean).join(', '),
        city,
        country,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      };
    })
    .filter((r) => {
      // Dédup par label plutôt que par coordonnées : Nominatim retourne parfois
      // deux entités distinctes (ex: ville + relation administrative) pour la
      // même ville avec des lat/lng légèrement différents, ce qui produisait
      // deux options "Marseille, France" identiques et indiscernables dans le
      // dropdown d'autocomplétion.
      if (seen.has(r.label)) return false;
      seen.add(r.label);
      return true;
    });

  return NextResponse.json(results);
}
