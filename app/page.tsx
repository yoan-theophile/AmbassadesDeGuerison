import MapWrapper from '@/components/MapWrapper';
import AppHeader from '@/components/AppHeader';
import { createServiceClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const [{ data: futureEvent }, { data: pastEvent }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, event_date')
      .gt('event_date', now)
      .order('event_date', { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from('events')
      .select('id, title, event_date')
      .lte('event_date', now)
      .order('event_date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <AppHeader />

      <div className="flex-1 relative">
        <MapWrapper
          nextEvent={futureEvent ?? null}
          lastEvent={pastEvent ?? null}
        />
      </div>

      <footer className="bg-white border-t border-slate-100 px-4 py-2 text-xs text-slate-400 text-center shrink-0">
        Lives de guérison avec David Théry — Trouvez une ambassade près de chez vous
      </footer>
    </div>
  );
}
