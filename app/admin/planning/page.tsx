import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import PlanningClient from '@/components/PlanningClient';

export const dynamic = 'force-dynamic';

async function getEvents() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('events')
    .select('id, title, event_date, live_link, description')
    .order('event_date', { ascending: false });
  return data ?? [];
}

export default async function AdminPlanningPage() {
  const events = await getEvents();

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <h1 className="text-base font-semibold text-slate-800 mb-6">Planning</h1>
        <PlanningClient events={events} />
      </div>
    </AdminLayout>
  );
}
