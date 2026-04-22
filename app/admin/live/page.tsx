import { createServiceClient } from '@/lib/supabase/server';
import AdminFeed from '@/components/AdminFeed';
import AdminTestimonialFeed from '@/components/AdminTestimonialFeed';

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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-6 py-4">
        <h1 className="text-xl font-bold">Live David Théry — Feed temps réel</h1>
        {event && (
          <p className="text-indigo-200 text-sm mt-0.5">
            {event.title} · {eventDate}
          </p>
        )}
        {!event && (
          <p className="text-indigo-300 text-sm mt-0.5">Aucun événement trouvé</p>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <h2 className="text-base font-semibold text-slate-800">Signaux live — Monter en live</h2>
          </div>
          <AdminFeed eventId={event?.id ?? null} />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <h2 className="text-base font-semibold text-slate-800">Témoignages — À publier</h2>
          </div>
          <AdminTestimonialFeed eventId={event?.id ?? null} />
        </section>
      </div>
    </main>
  );
}
