'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

const CHURCH_ATTENDANCE_OPTIONS = [
  { value: 'regular', label: 'Régulièrement (chaque semaine ou presque)' },
  { value: 'occasional', label: 'Occasionnellement (quelques fois par an)' },
  { value: 'none', label: 'Je ne fréquente pas une église actuellement' },
];

export default function QuestionnairePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const [form, setForm] = useState({
    healing_challenge_done: false,
    conferences_assistees: false,
    church_attendance: '',
    denomination: '',
    parcours_spirituel: '',
    phone: '',
    livres_lus: '',
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth'); return; }

      const { data: profile } = await supabase
        .from('host_profiles')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) { router.replace('/inscription'); return; }
      if (profile.status !== 'pre_approved') { setAccessDenied(true); setLoading(false); return; }
      setLoading(false);
    })();
  }, [router, supabase]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/ambassadeur/enrichissement', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Une erreur est survenue.');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </main>
    );
  }

  if (accessDenied) {
    return (
      <>
        <AppHeader />
        <main className="flex-1 bg-slate-50 px-4 py-16">
          <div className="max-w-sm mx-auto text-center">
            <p className="text-slate-500 text-sm mb-4">
              Ce questionnaire n'est accessible que pour les candidats pré-approuvés.
            </p>
            <Link href="/dashboard" className="text-indigo-600 text-sm hover:underline">
              Retour à mon espace
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <AppHeader />
        <main className="flex-1 bg-slate-50 px-4 py-16">
          <div className="max-w-sm mx-auto text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-lg font-semibold text-slate-800 mb-2">Profil envoyé !</h1>
            <p className="text-sm text-slate-500 mb-6">
              Ton profil a été transmis à l'équipe pour la validation finale.
              Tu seras informé par e-mail dès la décision prise.
            </p>
            <Link href="/dashboard" className="text-indigo-600 text-sm hover:underline">
              Retour à mon espace
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-slate-50 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mon espace
          </Link>

          <h1 className="text-xl font-semibold text-slate-800 mb-1">Compléter mon profil</h1>
          <p className="text-sm text-slate-500 mb-6">
            Aide David à mieux te connaître avant la validation finale de ton ambassade.
            Ces informations restent confidentielles.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Défi guérison */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-sm font-medium text-slate-700 mb-3">Formation</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.healing_challenge_done}
                  onChange={(e) => set('healing_challenge_done', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">
                  J'ai suivi le <strong>Défi Guérison</strong> de David Théry
                  <span className="block text-xs text-slate-400 mt-0.5">(formation gratuite en ligne sur la prière pour la guérison)</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={form.conferences_assistees}
                  onChange={(e) => set('conferences_assistees', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">
                  J'ai déjà assisté à une <strong>conférence de David Théry</strong>
                </span>
              </label>
            </div>

            {/* Pratique ecclésiale */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <p className="text-sm font-medium text-slate-700">Pratique ecclésiale</p>
              <Field label="Fréquentation d'une église">
                <select
                  value={form.church_attendance}
                  onChange={(e) => set('church_attendance', e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Sélectionner —</option>
                  {CHURCH_ATTENDANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Dénomination ou courant (optionnel)">
                <input
                  type="text"
                  value={form.denomination}
                  onChange={(e) => set('denomination', e.target.value)}
                  placeholder="Ex : catholique, évangélique, pentecôtiste…"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Parcours spirituel */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <p className="text-sm font-medium text-slate-700">Parcours personnel</p>
              <Field label="Ton parcours spirituel (en quelques lignes)">
                <textarea
                  value={form.parcours_spirituel}
                  onChange={(e) => set('parcours_spirituel', e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Comment en es-tu arrivé à vouloir ouvrir ton foyer ? Qu'est-ce qui t'a conduit à la prière pour la guérison ?"
                  className={inputCls}
                />
                <p className="text-xs text-slate-400 mt-1">{form.parcours_spirituel.length}/500</p>
              </Field>
              <Field label="Livres ou formations qui t'ont marqué (optionnel)">
                <textarea
                  value={form.livres_lus}
                  onChange={(e) => set('livres_lus', e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Ex : 'Guérir les malades' de Bill Johnson, l'IBRP…"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <Field label="Téléphone (optionnel)">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  maxLength={20}
                  className={inputCls}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Uniquement visible par l'équipe — jamais transmis aux visiteurs sans ton accord.
                </p>
              </Field>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Envoyer mon profil pour validation
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';
