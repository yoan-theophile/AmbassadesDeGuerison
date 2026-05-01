import Link from 'next/link';
import { getHomepageData } from '@/lib/homepage-data';
import { Quote } from 'lucide-react';

export default async function HomepageStorytelling() {
  const { nextEvent, totalAmbassadors, topTestimonials } = await getHomepageData();

  const countdown = getCountdown(nextEvent?.event_date);
  const lead = topTestimonials[0];
  const rest = topTestimonials.slice(1);

  return (
    <main className="bg-white min-h-[calc(100vh-41px)]">
      {/* Hero : témoignage en exergue */}
      {lead && (
        <section className="min-h-[calc(100vh-41px)] flex flex-col items-center justify-center px-6 py-16 text-center bg-slate-50">
          <Quote className="w-8 h-8 text-indigo-300 mb-6" />
          <blockquote className="text-xl sm:text-2xl text-slate-800 font-medium leading-relaxed max-w-2xl mb-8">
            {lead.content}
          </blockquote>
          <p className="text-slate-500 text-sm">
            {lead.visitor_name || lead.host_profiles?.first_name || 'Anonyme'}
            {(lead.host_profiles?.city || lead.submitter_city) && (
              <>, {lead.host_profiles?.city || lead.submitter_city}</>
            )}
          </p>
          <div className="mt-10 text-slate-300 text-xs animate-bounce">↓</div>
        </section>
      )}

      {/* Témoignages + compteur */}
      {rest.map((t, i) => (
        <section
          key={t.id}
          className={`min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 text-center ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
        >
          {i === 0 && (
            <p className="text-4xl sm:text-6xl font-bold text-indigo-600 tabular-nums mb-2">
              {totalAmbassadors}
            </p>
          )}
          {i === 0 && (
            <p className="text-slate-500 text-sm mb-12">
              ambassade{totalAmbassadors > 1 ? 's' : ''} — des maisons ouvertes lors de chaque live
            </p>
          )}
          <Quote className="w-5 h-5 text-indigo-200 mb-4" />
          <blockquote className="text-lg text-slate-700 leading-relaxed max-w-xl mb-4">
            {t.content}
          </blockquote>
          <p className="text-slate-400 text-xs">
            {t.visitor_name || t.host_profiles?.first_name || 'Anonyme'}
            {(t.host_profiles?.city || t.submitter_city) && `, ${t.host_profiles?.city || t.submitter_city}`}
          </p>
        </section>
      ))}

      {/* Section finale CTA */}
      <section className="px-6 py-20 text-center bg-indigo-600">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Ouvrez votre maison
        </h2>
        <p className="text-indigo-200 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          Chaque ambassade est une maison ouverte. Un canapé, un écran, une prière partagée.
        </p>
        {countdown && (
          <p className="text-indigo-200 text-xs mb-6">Prochain live dans {countdown}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
          <Link
            href="/inscription"
            className="bg-white text-indigo-700 text-sm font-medium py-3 px-6 rounded-xl text-center hover:bg-indigo-50 transition-colors"
          >
            Devenir ambassadeur
          </Link>
          <Link
            href="/"
            className="border border-indigo-400 text-white text-sm font-medium py-3 px-6 rounded-xl text-center hover:bg-indigo-700 transition-colors"
          >
            Trouver un groupe
          </Link>
        </div>
      </section>
    </main>
  );
}

function getCountdown(eventDate?: string): string | null {
  if (!eventDate) return null;
  const diff = new Date(eventDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins} min`;
}
