import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import PlanningClient from '@/components/PlanningClient';
import CalendrierCampaignSection from './CalendrierCampaignSection';

export const dynamic = 'force-dynamic';

export default async function AdminCalendrierPage() {
  const supabase = createServiceClient();

  const [{ data: events }, { data: campaigns }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, event_date, live_link, description')
      .order('event_date', { ascending: true }),
    supabase
      .from('scheduled_campaigns')
      .select('id, type, event_id, status, scheduled_at, sent_count, custom_message')
      .order('scheduled_at', { ascending: true }),
  ]);

  const futureEvents = (events ?? []).filter(
    (e) => new Date(e.event_date as string) > new Date()
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">Calendrier</h1>
          <p className="text-slate-500 text-sm">Gestion des lives et des campagnes e-mail.</p>
        </div>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-4">Lives</h2>
          <PlanningClient events={events ?? []} />
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-4">Campagnes planifiées</h2>
          <CalendrierCampaignSection
            futureEvents={futureEvents.map((e) => ({ id: e.id as string, title: e.title as string, event_date: e.event_date as string }))}
            campaigns={campaigns ?? []}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
