'use client';

import { useState } from 'react';
import { Star, CheckCircle2, AlertTriangle } from 'lucide-react';

const CRITERIA = [
  { key: 'welcome',      label: 'Accueil' },
  { key: 'friendliness', label: 'Convivialité' },
  { key: 'listening',    label: 'Écoute' },
  { key: 'prayer',       label: 'Temps de prière' },
] as const;

type CriterionKey = typeof CRITERIA[number]['key'];

interface Props {
  eventId: string;
  hostProfileId: string;
  contactRequestId: string;
  visitorEmail: string;
  direction: 'visitor_to_host' | 'host_to_visitor';
}

export default function FeedbackForm({ eventId, hostProfileId, contactRequestId, visitorEmail, direction }: Props) {
  const [ratings, setRatings] = useState<Partial<Record<CriterionKey, number>>>({});
  const [hover, setHover] = useState<Partial<Record<CriterionKey, number>>>({});
  const [freeText, setFreeText] = useState('');
  const [reported, setReported] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Flèches : déplace la sélection ET le focus (le bouton cible devient le seul
  // tabbable du groupe au re-render). Home/End vont aux extrémités.
  function handleStarKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, key: CriterionKey, star: number) {
    const NEXT: Record<string, number> = {
      ArrowRight: star + 1, ArrowUp: star + 1,
      ArrowLeft: star - 1,  ArrowDown: star - 1,
      Home: 1, End: 5,
    };
    const target = NEXT[e.key];
    if (target === undefined) return;
    e.preventDefault();
    const clamped = Math.min(5, Math.max(1, target));
    setRatings((r) => ({ ...r, [key]: clamped }));
    const group = e.currentTarget.parentElement;
    (group?.children[clamped - 1] as HTMLButtonElement | undefined)?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        host_profile_id: hostProfileId,
        contact_request_id: contactRequestId,
        visitor_email: visitorEmail,
        direction,
        ratings: {
          welcome:      ratings.welcome ?? null,
          friendliness: ratings.friendliness ?? null,
          listening:    ratings.listening ?? null,
          prayer:       ratings.prayer ?? null,
        },
        free_text: freeText.trim() || null,
        reported,
        report_reason: reported ? reportReason.trim() || null : null,
        website: '', // honeypot
      }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error ?? 'Une erreur est survenue.');
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
        <p className="text-slate-800 font-semibold text-lg mb-2">Merci pour votre retour !</p>
        <p className="text-slate-500 text-sm leading-relaxed">
          Votre avis aide la communauté à grandir.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-5">
      {/* Étoiles par critère */}
      {CRITERIA.map((c) => (
        <div key={c.key}>
          <p className="text-sm font-medium text-slate-700 mb-2">{c.label}</p>
          <div role="radiogroup" aria-label={c.label} className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hover[c.key] ?? ratings[c.key] ?? 0) >= star;
              const selected = ratings[c.key] ?? 0;
              // Pattern radiogroup : un seul arrêt de tabulation par critère, on
              // navigue ensuite aux flèches. Sans ça les 4 critères imposaient 20
              // tabulations pour traverser le formulaire (trouvé en QA 2026-08-07).
              // Aucune note encore posée → la 1re étoile porte le focus.
              const focusable = selected === star || (selected === 0 && star === 1);
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={ratings[c.key] === star}
                  aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                  tabIndex={focusable ? 0 : -1}
                  className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active ? 'text-indigo-600' : 'text-slate-200 hover:text-slate-300'
                  }`}
                  onMouseEnter={() => setHover((h) => ({ ...h, [c.key]: star }))}
                  onMouseLeave={() => setHover((h) => ({ ...h, [c.key]: 0 }))}
                  onClick={() => setRatings((r) => ({ ...r, [c.key]: star }))}
                  onKeyDown={(e) => handleStarKeyDown(e, c.key, star)}
                >
                  <Star className={`w-8 h-8 ${active ? 'fill-indigo-600' : 'fill-current'}`} />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Texte libre */}
      <div>
        <label htmlFor="feedback-free-text" className="block text-sm font-medium text-slate-700 mb-1.5">
          Un mot à partager ? (optionnel)
        </label>
        <textarea
          id="feedback-free-text"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
          placeholder="Ce qui vous a touché, une prière particulière…"
          maxLength={1000}
        />
      </div>

      {/* Signalement */}
      <div>
        {/* Touch target 44px (DESIGN.md) : la case faisait 13x13px — le contrôle
            le plus important de la page était le plus dur à atteindre au doigt.
            py-2.5 + case w-5 h-5 portent la zone cliquable du label à 44px. */}
        <label className="flex items-center gap-2.5 cursor-pointer py-2.5 -my-2.5 min-h-[44px]">
          <input
            type="checkbox"
            checked={reported}
            onChange={(e) => setReported(e.target.checked)}
            className="w-5 h-5 shrink-0 accent-red-600"
          />
          <span className="flex items-center gap-1.5 text-sm text-slate-600">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            Signaler un problème
          </span>
        </label>
        {reported && (
          <textarea
            aria-label="Décrivez le problème rencontré"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={2}
            className="mt-2 w-full border border-red-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-white"
            placeholder="Décrivez ce qui s'est passé…"
            required={reported}
          />
        )}
      </div>

      {/* Honeypot */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Envoi…' : 'Envoyer mon avis'}
      </button>
    </form>
  );
}
