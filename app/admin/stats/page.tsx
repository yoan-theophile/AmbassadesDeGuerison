import { createServiceClient } from '@/lib/supabase/server';
import { Home, Globe, Mail, MessageSquare, type LucideIcon } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

export const dynamic = 'force-dynamic';

async function getKpis() {
  const supabase = createServiceClient();

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

  const { data: acts } = await supabase
    .from('host_activations')
    .select('id')
    .eq('event_id', lastEvent.id);

  const actIds = (acts ?? []).map((a) => a.id);
  const safeActIds = actIds.length > 0 ? actIds : ['00000000-0000-0000-0000-000000000000'];

  const [activations, countries, contacts, testimonials] = await Promise.all([
    supabase.from('host_activations').select('id', { count: 'exact' }).eq('event_id', lastEvent.id).eq('is_active', true),
    supabase.from('host_profiles').select('country').eq('status', 'active'),
    supabase.from('contact_requests').select('id', { count: 'exact', head: true }).in('host_activation_id', safeActIds),
    supabase.from('testimonials').select('id', { count: 'exact' }).eq('is_visible', true),
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
    <AdminLayout>
      <div className="px-6 py-8">
        <h1 className="text-base font-semibold text-slate-800 mb-1">Vue générale</h1>

        {lastEvent ? (
          <>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              <p className="text-sm text-slate-500">
                Dernier live : <span className="font-medium text-slate-700">{lastEvent.title}</span>
                {' '}·{' '}
                <span>{new Date(lastEvent.event_date).toLocaleDateString('fr-FR')}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
              <KpiCard label="Ambassades actives" value={kpis!.activeAmbassades} Icon={Home} color="indigo" />
              <KpiCard label="Pays représentés" value={kpis!.uniqueCountries} Icon={Globe} color="violet" />
              <KpiCard label="Demandes de contact" value={kpis!.contactRequests} Icon={Mail} color="sky" />
              <KpiCard label="Témoignages visibles" value={kpis!.testimonials} Icon={MessageSquare} color="emerald" />
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 text-sm">Aucun live passé.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const colorMap = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', value: 'text-indigo-700' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', value: 'text-violet-700' },
  sky:    { bg: 'bg-sky-50',    icon: 'text-sky-600',    value: 'text-sky-700'    },
  emerald:{ bg: 'bg-emerald-50',icon: 'text-emerald-600',value: 'text-emerald-700'},
};

function KpiCard({ label, value, Icon, color }: { label: string; value: number; Icon: LucideIcon; color: keyof typeof colorMap }) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={`w-4.5 h-4.5 ${c.icon}`} style={{ width: 18, height: 18 }} />
      </div>
      <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
    </div>
  );
}
