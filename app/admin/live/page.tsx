import { createServiceClient } from '@/lib/supabase/server';
import AdminFeed from '@/components/AdminFeed';
import LiveTestimonialsCounter from '@/components/LiveTestimonialsCounter';
import AdminLayout from '@/components/AdminLayout';

export const dynamic = 'force-dynamic';

async function getLastEvent() {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  let { data: lastEvent } = await supabase
    .from('events')
    .select('id, title, event_date')
    .lte('event_date', now)
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (!lastEvent) {
    const { data: futureEvent } = await supabase
      .from('events')
      .select('id, title, event_date')
      .gt('event_date', now)
      .order('event_date', { ascending: true })
      .limit(1)
      .single();
    lastEvent = futureEvent;
  }

  return lastEvent;
}

export default async function AdminLivePage() {
  const event = await getLastEvent();

  const eventDate = event
    ? new Date(event.event_date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null;

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-base font-semibold text-slate-800">
            {event ? event.title : 'Live en cours'}
          </h1>
          {eventDate && (
            <p className="text-sm text-slate-400 mt-0.5">{eventDate}</p>
          )}
          {!event && (
            <p className="text-sm text-slate-400 mt-0.5">Aucun événement trouvé</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h2 className="text-sm font-semibold text-slate-700">Mains levées</h2>
            </div>
            <AdminFeed eventId={event?.id ?? null} />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
              <h2 className="text-sm font-semibold text-slate-700">Témoignages</h2>
            </div>
            <LiveTestimonialsCounter eventId={event?.id ?? null} />
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
