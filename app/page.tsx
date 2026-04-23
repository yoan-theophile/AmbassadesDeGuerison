import MapWrapper from '@/components/MapWrapper';
import AppHeader from '@/components/AppHeader';
import { createServiceClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServiceClient();
  const now = new Date();
  const nowISO = now.toISOString();

  const windowHours = parseInt(process.env.NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS ?? '4');
  const windowStart = new Date(now.getTime() - windowHours * 3600 * 1000).toISOString();

  const [{ data: futureEvent }, { data: pastEvent }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, event_date')
      .gt('event_date', nowISO)
      .order('event_date', { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from('events')
      .select('id, title, event_date')
      .lte('event_date', nowISO)
      .order('event_date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const liveInProgress = !!pastEvent && pastEvent.event_date >= windowStart;

  return (
    <div className="flex flex-col h-screen bg-white">
      <AppHeader />

      <div className="flex-1 relative">
        <MapWrapper
          nextEvent={futureEvent ?? null}
          lastEvent={pastEvent ?? null}
          liveInProgress={liveInProgress}
        />
      </div>

      <footer className="bg-white border-t border-slate-100 px-4 py-2 text-xs text-slate-500 text-center shrink-0">
        Ambassades de Guérison — rejoignez un groupe de prière lors des lives de David Théry
      </footer>
    </div>
  );
}
