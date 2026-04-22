import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ambassades-guerison.fr';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '6',
    addressdetails: '1',
    featuretype: 'city',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      'User-Agent': `AmbassadesGuerison/1.0 (+${APP_URL})`,
      'Accept-Language': 'fr',
    },
    next: { revalidate: 60 },
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json([]);

  const raw: any[] = await res.json();

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
    });

  return NextResponse.json(results);
}
