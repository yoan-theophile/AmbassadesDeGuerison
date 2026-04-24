import { createServiceClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import TemoignageCard from '@/components/TemoignageCard';
import TemoignageShareButtons from '@/components/TemoignageShareButtons';
import TemoignageLiveFilter from '@/components/TemoignageLiveFilter';
import Link from 'next/link';
import { MapPin, Sparkles, PenLine, Users, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ambassades-guerison.fr';

async function getTemoignages(eventId?: string) {
  const supabase = createServiceClient();
  let query = supabase
    .from('testimonials')
    .select('id, content, timing, created_at, visitor_name, submitter_city, host_profile:host_profiles(first_name, city), event:events(id, title)')
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (eventId) query = query.eq('event_id', eventId);
  const { data } = await query;
  return data ?? [];
}

async function getEvents() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('events')
    .select('id, title')
    .order('event_date', { ascending: false })
    .limit(20);
  return data ?? [];
}

export default async function TemoignagesPage({
  searchParams,
}: {
  searchParams: Promise<{ live?: string }>;
}) {
  const { live } = await searchParams;
  const [temoignages, events] = await Promise.all([
    getTemoignages(live),
    getEvents(),
  ]);

  const cities = new Set<string>();
  temoignages.forEach((t) => {
    const hp = Array.isArray(t.host_profile) ? t.host_profile[0] : t.host_profile;
    const city = hp?.city ?? (t as Record<string, unknown>).submitter_city as string | null;
    if (city) cities.add(city);
  });

  const activeEvent = live ? events.find((e) => e.id === live) : null;
  const pageUrl = `${APP_URL}/temoignages`;
  const waText = `Ce que Dieu a fait — témoignages des lives de David Théry : ${pageUrl}`;

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-12">

          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-800">Ce que Dieu a fait</h1>
            <p className="text-slate-500 text-sm mt-2">
              Témoignages reçus lors des lives de David Théry.
            </p>

            {/* Stats */}
            {temoignages.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  {temoignages.length} témoignage{temoignages.length > 1 ? 's' : ''}
                </span>
                {cities.size > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    {cities.size} ville{cities.size > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Filtre par live */}
          {events.length > 0 && (
            <TemoignageLiveFilter
              events={events.map((e) => ({ id: e.id as string, title: e.title as string }))}
              currentLive={live}
              activeEventTitle={activeEvent?.title as string | undefined}
            />
          )}

          {/* Grille ou état vide */}
          {temoignages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">
                {live
                  ? 'Aucun témoignage publié pour ce live.'
                  : 'Les premiers témoignages arrivent bientôt.'}
              </p>
              <Link
                href={`/temoignages/nouveau${live ? `?live=${live}` : ''}`}
                className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Partage ton expérience
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 items-start">
                {temoignages.map((t) => {
                  const hp = Array.isArray(t.host_profile) ? t.host_profile[0] : t.host_profile;
                  const ev = Array.isArray(t.event) ? t.event[0] : t.event;
                  const raw = t as Record<string, unknown>;
                  const displayName = hp
                    ? `${hp.first_name}, ${hp.city}`
                    : raw.visitor_name
                      ? `${raw.visitor_name}${raw.submitter_city ? `, ${raw.submitter_city}` : ''}`
                      : null;
                  return (
                    <TemoignageCard
                      key={t.id}
                      content={t.content}
                      hostName={displayName}
                      eventTitle={ev?.title ?? null}
                      timing={t.timing}
                    />
                  );
                })}
              </div>

              {/* CTAs */}
              <div className="mt-12 space-y-6 text-center">
                <Link
                  href={`/temoignages/nouveau${live ? `?live=${live}` : ''}`}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  Partage ton témoignage
                </Link>

                <div className="border-t border-slate-100 pt-6 flex flex-col items-center gap-3">
                  <p className="text-slate-400 text-sm">Partager cette page</p>
                  <TemoignageShareButtons url={pageUrl} whatsappText={waText} />
                </div>

                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Rejoindre une ambassade
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
