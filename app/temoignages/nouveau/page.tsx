import { createServiceClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import NouveauTemoignageForm from '@/components/NouveauTemoignageForm';

export const dynamic = 'force-dynamic';

async function getEvents() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('events')
    .select('id, title, event_date')
    .order('event_date', { ascending: false })
    .limit(20);
  return (data ?? []).map((e) => ({
    id: e.id as string,
    title: e.title as string,
    event_date: e.event_date as string,
  }));
}

export default async function NouveauTemoignagePage({
  searchParams,
}: {
  searchParams: Promise<{ live?: string }>;
}) {
  const { live } = await searchParams;
  const events = await getEvents();
  const defaultEventId = live && events.some((e) => e.id === live) ? live : undefined;

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-12">
          <NouveauTemoignageForm events={events} defaultEventId={defaultEventId} />
        </div>
      </main>
    </>
  );
}
