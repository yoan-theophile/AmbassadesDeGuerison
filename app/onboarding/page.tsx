'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Download, Play } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { createClient } from '@/lib/supabase/browser';
import { ONBOARDING } from '@/config/onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      supabase
        .from('host_profiles')
        .select('status')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.status === 'active') {
            router.replace('/dashboard');
          } else {
            setAuthLoading(false);
          }
        });
    });
  }, [router]);

  async function handleSubmit() {
    if (!checked) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/onboarding/complete', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Une erreur est survenue. Réessayez.');
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
          Chargement…
        </div>
      </main>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-slate-50 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          <div>
            <h1 className="text-xl font-semibold text-slate-800">Finaliser mon inscription</h1>
            <p className="text-slate-500 text-sm mt-1">
              Regardez la vidéo de formation, téléchargez le guide pratique, puis validez votre engagement.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <Play className="w-4 h-4 text-indigo-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Formation ambassadeur</h2>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={ONBOARDING.VIDEO_URL}
                title="Formation ambassadeur — David Théry"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Guide pratique de l'ambassade</p>
                <p className="text-slate-500 text-xs mt-0.5">Informations pratiques pour accueillir lors des lives</p>
              </div>
              <a
                href={ONBOARDING.PDF_PATH}
                download
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-indigo-100 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <span className="text-sm text-slate-700">
                J'ai regardé la vidéo de formation et je m'engage à accueillir les participants
                dans l'esprit de la charte des Ambassades de Guérison.
              </span>
            </label>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!checked || loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Activation…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Rejoindre les Ambassades de Guérison
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
