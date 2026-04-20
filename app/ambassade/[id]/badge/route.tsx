import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: host } = await supabase
    .from('host_profiles')
    .select('first_name, city, country, host_type, status')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (!host) {
    return new Response('Not found', { status: 404 });
  }

  const typeLabel = host.host_type === 'church' ? 'Église ambassade' : 'Ambassade privée';

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
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          {host.first_name}
        </div>
        <div style={{ fontSize: '18px', opacity: 0.9, marginBottom: '4px' }}>
          {host.city}, {host.country}
        </div>
        <div
          style={{
            marginTop: '16px',
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '14px',
          }}
        >
          {typeLabel} — Ambassades de Guérison
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    }
  );
}
