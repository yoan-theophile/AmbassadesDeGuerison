import { ImageResponse } from 'next/og';

// Image OG (1200x630) du badge ambassade — utilisée pour les previews de
// partage WhatsApp/réseaux et le bouton "Voir mon badge" dans /dashboard.
//
// IMPORTANT — ne PAS importer @supabase/supabase-js ici : combiné avec
// next/og ImageResponse sur Next.js 16, l'import crashe silencieusement
// la route (ERR_EMPTY_RESPONSE). On utilise un fetch direct vers l'API
// REST PostgREST de Supabase.
//
// IMPORTANT — ne PAS déclarer `export const runtime = 'edge'` : le edge
// runtime aggrave le crash (même symptôme).

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let host: { first_name: string; city: string; country: string; host_type: string } | null = null;
  if (supabaseUrl && serviceKey) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/host_profiles?id=eq.${id}&status=eq.validated&select=first_name,city,country,host_type`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    );
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) host = rows[0];
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: host
            ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
            : 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          {host ? host.first_name : 'Badge non disponible'}
        </div>
        {host && (
          <div style={{ fontSize: '18px', opacity: 0.9, marginBottom: '4px' }}>
            {host.city}, {host.country}
          </div>
        )}
        <div
          style={{
            marginTop: '16px',
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '14px',
          }}
        >
          {host
            ? `${host.host_type === 'church' ? 'Église ambassade' : 'Ambassade privée'} — Ambassades de Guérison`
            : 'Ambassades de Guérison'}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Cache navigateur 24h + revalidation tolérée 1h. Le badge change
        // rarement (nom/ville) : le coût Vercel devient négligeable car
        // les previews WhatsApp/réseaux servent l'image depuis le CDN.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    }
  );
}
