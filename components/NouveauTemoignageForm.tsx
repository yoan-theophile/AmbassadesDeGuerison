'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface Props {
  events: Event[];
  defaultEventId?: string;
}

export default function NouveauTemoignageForm({ events, defaultEventId }: Props) {
  const firstId = defaultEventId ?? events[0]?.id ?? '';
  const [eventId, setEventId] = useState(firstId);
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [timing, setTiming] = useState<'during' | 'after'>('after');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">Aucun live disponible pour l'instant.</p>
        <Link href="/temoignages" className="mt-4 inline-flex items-center gap-1.5 text-indigo-600 text-sm hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux témoignages
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Merci pour ton témoignage</h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Il sera relu avant d'être publié. Ce que Dieu fait mérite d'être partagé.
        </p>
        <Link
          href="/temoignages"
          className="mt-6 inline-flex items-center gap-1.5 text-indigo-600 text-sm hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voir les témoignages
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/temoignages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        content: content.trim(),
        submitter_name: name.trim() || undefined,
        submitter_city: city.trim() || undefined,
        timing,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.');
      setLoading(false);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div>
      <Link
        href="/temoignages"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour aux témoignages
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">Partage ton témoignage</h1>
        <p className="text-slate-500 text-sm mb-7">
          Qu'as-tu vécu pendant ce live ? En attente de modération avant publication.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="event" className="block text-sm font-medium text-slate-700 mb-1.5">
              Live concerné
            </label>
            <select
              id="event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timing" className="block text-sm font-medium text-slate-700 mb-1.5">
              Quand as-tu vécu ça ?
            </label>
            <div className="flex gap-3">
              {(['during', 'after'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTiming(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    timing === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {t === 'during' ? 'Pendant le live' : 'Après le live'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1.5">
              Ton témoignage <span className="text-slate-400 font-normal">(requis)</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength={20}
              maxLength={2000}
              rows={5}
              placeholder="Ce que j'ai vécu pendant ce live..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
            <p className="mt-1 text-xs text-slate-400 text-right">{content.length}/2000</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Prénom <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Marie"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">
                Ville <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={80}
                placeholder="Lyon"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || content.trim().length < 20}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Envoi en cours…' : 'Envoyer mon témoignage'}
          </button>
        </form>
      </div>
    </div>
  );
}
