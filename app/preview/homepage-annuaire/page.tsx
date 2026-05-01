import Link from 'next/link';
import { getHomepageData } from '@/lib/homepage-data';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomepageAnnuaire() {
  const { nextEvent, totalAmbassadors, totalCountries } = await getHomepageData();

  const supabase = createServiceClient();
  const { data: hosts } = await supabase
    .from('host_profiles')
    .select('country, city')
    .eq('status', 'validated');

  const byCountry = buildCountryTable(hosts ?? []);
  const countdown = getCountdown(nextEvent?.event_date);

  return (
    <main className="bg-white min-h-[calc(100vh-41px)] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Countdown discret */}
        {countdown && (
          <p className="text-right text-xs text-slate-400 mb-8 tabular-nums">
            Prochain live dans {countdown}
          </p>
        )}

        {/* Hero compteur */}
        <div className="mb-12">
          <p className="text-8xl sm:text-9xl font-bold text-slate-900 tabular-nums leading-none">
            {totalAmbassadors}
          </p>
          <p className="text-slate-500 text-base mt-2">
            ambassade{totalAmbassadors > 1 ? 's' : ''} validée{totalAmbassadors > 1 ? 's' : ''} dans {totalCountries} pays
          </p>
        </div>

        {/* Tableau pays */}
        {byCountry.length > 0 && (
          <div className="border border-slate-100 rounded-2xl overflow-hidden mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Pays</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide tabular-nums">Ambassades</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Villes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {byCountry.map((row) => (
                  <tr key={row.country} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-800 font-medium">{row.country}</td>
                    <td className="px-5 py-3.5 text-indigo-600 font-bold tabular-nums text-right">{row.count}</td>
                    <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{row.cities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/inscription"
            className="flex-1 bg-indigo-600 text-white text-sm font-medium py-3 px-6 rounded-xl text-center hover:bg-indigo-700 transition-colors"
          >
            Devenir ambassadeur
          </Link>
          <Link
            href="/"
            className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-3 px-6 rounded-xl text-center hover:bg-slate-50 transition-colors"
          >
            Voir sur la carte
          </Link>
        </div>
      </div>
    </main>
  );
}

type Row = { country: string; count: number; cities: string };

function buildCountryTable(hosts: { country: string; city: string }[]): Row[] {
  const map = new Map<string, Set<string>>();
  for (const h of hosts) {
    if (!map.has(h.country)) map.set(h.country, new Set());
    map.get(h.country)!.add(h.city);
  }
  return [...map.entries()]
    .map(([country, cities]) => ({
      country,
      count: cities.size,
      cities: [...cities].slice(0, 3).join(', ') + (cities.size > 3 ? '…' : ''),
    }))
    .sort((a, b) => b.count - a.count);
}

function getCountdown(eventDate?: string): string | null {
  if (!eventDate) return null;
  const diff = new Date(eventDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}j ${hours}h`;
  return `${hours}h`;
}
