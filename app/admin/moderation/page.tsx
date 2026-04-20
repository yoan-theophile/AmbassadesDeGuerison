import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import AdminFeed from '@/components/AdminFeed';

async function getAdminSession() {
  const supabase = createServiceClient();
  // L'admin auth est vérifié via le cookie de session Supabase (middleware)
  // Ici on retourne simplement les données initiales pour le SSR
  const { data: lastEvent } = await supabase
    .from('events')
    .select('id, title, event_date')
    .lte('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  return lastEvent;
}

export default async function AdminModerationPage() {
  const lastEvent = await getAdminSession();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-6 py-4">
        <h1 className="text-xl font-bold">Feed Admin — Signaux live</h1>
        {lastEvent && (
          <p className="text-indigo-200 text-sm mt-0.5">{lastEvent.title}</p>
        )}
      </header>
      <AdminFeed eventId={lastEvent?.id ?? null} />
    </main>
  );
}
