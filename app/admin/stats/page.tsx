import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getKpis() {
  const supabase = createServiceClient();

  // Dernier live = event passé le plus récent
  const { data: lastEvent } = await supabase
    .from('events')
    .select('id, title, event_date')
    .lte('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (!lastEvent) {
    return { lastEvent: null, kpis: null };
  }

  const [activations, countries, contacts, testimonials] = await Promise.all([
    supabase
      .from('host_activations')
      .select('id', { count: 'exact' })
      .eq('event_id', lastEvent.id)
      .eq('is_active', true),
    supabase
      .from('host_profiles')
      .select('country')
      .eq('status', 'active'),
    supabase
      .from('contact_requests')
      .select('id', { count: 'exact' })
      .eq('host_activations.event_id', lastEvent.id),
    supabase
      .from('testimonials')
      .select('id', { count: 'exact' })
      .eq('is_visible', true),
  ]);

  const uniqueCountries = new Set((countries.data ?? []).map((h) => h.country)).size;

  return {
    lastEvent,
    kpis: {
      activeAmbassades: activations.count ?? 0,
      uniqueCountries,
      contactRequests: contacts.count ?? 0,
      testimonials: testimonials.count ?? 0,
    },
  };
}

export default async function AdminStatsPage() {
  const { lastEvent, kpis } = await getKpis();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-6 py-4">
        <h1 className="text-xl font-bold">Dashboard Admin — KPIs</h1>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {lastEvent ? (
          <>
            <p className="text-gray-500 text-sm mb-6">
              Dernier live : <span className="font-medium text-gray-700">{lastEvent.title}</span>{' '}
              ({new Date(lastEvent.event_date).toLocaleDateString('fr-FR')})
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Ambassades actives" value={kpis!.activeAmbassades} icon="🏠" />
              <KpiCard label="Pays représentés" value={kpis!.uniqueCountries} icon="🌍" />
              <KpiCard label="Demandes de contact" value={kpis!.contactRequests} icon="✉️" />
              <KpiCard label="Témoignages totaux" value={kpis!.testimonials} icon="💬" />
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-center py-16">Aucun live passé.</p>
        )}
      </div>
    </main>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-3xl font-bold text-indigo-700">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
