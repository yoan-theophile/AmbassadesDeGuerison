import Link from 'next/link';
import { getHomepageData } from '@/lib/homepage-data';
import { getCountdown, daysSince } from '@/lib/preview-utils';
import { Radio } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomepagePoster() {
  const { nextEvent, lastEvent, liveInProgress, totalAmbassadors, totalCountries } = await getHomepageData();

  const countdown = getCountdown(nextEvent?.event_date);

  return (
    <main className="min-h-[calc(100vh-41px)] bg-white flex flex-col">
      {/* Hero typographique */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        {liveInProgress && (
          <div className="flex items-center gap-2 mb-8 bg-indigo-50 px-4 py-2 rounded-full">
            <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-indigo-700 text-sm font-medium">Live en cours</span>
          </div>
        )}

        <h1 className="text-5xl sm:text-7xl font-bold text-slate-900 tracking-tight leading-none mb-6">
          AMBASSADES<br />DE GUÉRISON
        </h1>

        <p className="text-slate-500 text-base sm:text-lg max-w-sm mb-10 leading-relaxed">
          Rejoignez un groupe de prière lors des lives de David Théry — dans votre ville, dans votre quartier.
        </p>

        {countdown && (
          <div className="mb-10">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Prochain live</p>
            <p className="text-3xl sm:text-4xl font-bold text-indigo-600 tabular-nums">{countdown}</p>
          </div>
        )}

        {!nextEvent && lastEvent && (
          <p className="text-slate-400 text-sm mb-10">
            Dernier live il y a {daysSince(lastEvent.event_date)} jour{daysSince(lastEvent.event_date) > 1 ? 's' : ''} — prochainement
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
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
            Voir la carte
          </Link>
        </div>
      </section>

      {/* Footer discret */}
      <footer className="border-t border-slate-100 px-4 py-4 flex items-center justify-center gap-6 text-xs text-slate-400">
        <span>{totalAmbassadors} ambassade{totalAmbassadors > 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{totalCountries} pays</span>
      </footer>
    </main>
  );
}

