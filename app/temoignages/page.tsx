import { createServiceClient } from '@/lib/supabase/server';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import { MapPin, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getTemoignages() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('testimonials')
    .select('id, content, timing, created_at, host_profile:host_profiles(first_name, city, country)')
    .eq('is_visible', true)
    .order('created_at', { ascending: false });
  return data ?? [];
}

const TIMING_LABELS: Record<string, string> = {
  during: 'Pendant le live',
  after:  'Après le live',
};

export default async function TemoignagesPage() {
  const temoignages = await getTemoignages();

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-800">Témoignages</h1>
            <p className="text-slate-500 text-sm mt-2">
              Ce que vivent les ambassades à travers le monde.
            </p>
          </div>

          {temoignages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">Aucun témoignage publié pour l'instant.</p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 text-indigo-600 text-sm hover:underline"
              >
                <MapPin className="w-4 h-4" />
                Trouver une ambassade
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {temoignages.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <p className="text-slate-700 text-sm leading-relaxed">"{t.content}"</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-slate-500">
                      {Array.isArray(t.host_profile) && t.host_profile[0]
                        ? `${t.host_profile[0].first_name}, ${t.host_profile[0].city}`
                        : 'Ambassade'}
                    </span>
                    {t.timing && <span>{TIMING_LABELS[t.timing] ?? t.timing}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Rejoindre une ambassade
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
