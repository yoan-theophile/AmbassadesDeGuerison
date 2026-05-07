import { createServiceClient } from '@/lib/supabase/server';
import AdminFeed from '@/components/AdminFeed';
import LiveTestimonialsCounter from '@/components/LiveTestimonialsCounter';
import AdminLayout from '@/components/AdminLayout';
import LiveCloseButton from '@/components/LiveCloseButton';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Event = { id: string; title: string; event_date: string };

async function getCurrentEvent(): Promise<{ event: Event | null; isCurrentLive: boolean }> {
  const supabase = createServiceClient();
  const now = new Date();
  const pastHours = Number(process.env.LIVE_WINDOW_PAST_HOURS ?? 6);
  const futureHours = Number(process.env.LIVE_WINDOW_FUTURE_HOURS ?? 4);
  const windowStart = new Date(now.getTime() - pastHours * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + futureHours * 60 * 60 * 1000).toISOString();

  // Événement dans la fenêtre active : démarré il y a moins de LIVE_WINDOW_PAST_HOURS ou dans les LIVE_WINDOW_FUTURE_HOURS
  const { data: current } = await supabase
    .from('events')
    .select('id, title, event_date')
    .gte('event_date', windowStart)
    .lte('event_date', windowEnd)
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (current) return { event: current, isCurrentLive: true };

  // Fallback : dernier événement passé
  const { data: last } = await supabase
    .from('events')
    .select('id, title, event_date')
    .lte('event_date', now.toISOString())
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (last) return { event: last, isCurrentLive: false };

  // Dernier recours : prochain événement futur
  const { data: next } = await supabase
    .from('events')
    .select('id, title, event_date')
    .gt('event_date', now.toISOString())
    .order('event_date', { ascending: true })
    .limit(1)
    .single();

  return { event: next ?? null, isCurrentLive: false };
}

export default async function AdminLivePage() {
  const { event, isCurrentLive } = await getCurrentEvent();
  const futureHours = Number(process.env.LIVE_WINDOW_FUTURE_HOURS ?? 4);

  const eventDate = event
    ? new Date(event.event_date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null;

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        {!isCurrentLive && event && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 max-w-2xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Aucun live détecté dans les {futureHours} prochaines heures.{' '}
              <Link href="/admin/calendrier" className="underline underline-offset-2 hover:text-amber-900">
                Vérifiez le calendrier
              </Link>{' '}
              — affichage du dernier événement connu.
            </p>
          </div>
        )}

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
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
          {isCurrentLive && event && (
            <LiveCloseButton eventId={event.id} />
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
