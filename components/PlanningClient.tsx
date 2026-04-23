'use client';

import { useState, useTransition } from 'react';
import { Plus, Link as LinkIcon, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  event_date: string;
  live_link: string | null;
  description: string | null;
}

export default function PlanningClient({ events }: { events: Event[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState('');
  const [error, setError] = useState('');

  const now = new Date().toISOString();
  const upcoming = events.filter((e) => e.event_date >= now);
  const past = events.filter((e) => e.event_date < now);

  async function createEvent(formData: FormData) {
    setError('');
    const title = (formData.get('title') as string).trim();
    const event_date = formData.get('event_date') as string;
    const live_link = (formData.get('live_link') as string).trim() || null;

    if (!title || !event_date) { setError('Titre et date sont requis.'); return; }

    const supabase = createClient();
    const { error: err } = await supabase.from('events').insert({ title, event_date, live_link });
    if (err) { setError(err.message); return; }

    setShowForm(false);
    startTransition(() => router.refresh());
  }

  async function saveLiveLink(eventId: string) {
    const supabase = createClient();
    const { error: err } = await supabase
      .from('events')
      .update({ live_link: linkValue.trim() || null })
      .eq('id', eventId);
    if (err) { setError(err.message); return; }
    setEditingLink(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-slate-500">{upcoming.length} à venir · {past.length} passés</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau live
        </button>
      </div>

      {showForm && (
        <form
          action={createEvent}
          className="bg-white border border-slate-100 rounded-xl p-5 mb-6 space-y-3"
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Nouveau live</h2>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div>
            <label className="text-xs text-slate-500 block mb-1">Titre</label>
            <input
              name="title"
              placeholder="Live Guérison #16 — …"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Date et heure</label>
            <input
              name="event_date"
              type="datetime-local"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Lien du live (optionnel)</label>
            <input
              name="live_link"
              placeholder="https://youtube.com/live/..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-500 px-4 py-2 rounded-lg text-sm hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun événement. Créez le premier live.</p>
      ) : (
        <div className="space-y-3">
          {upcoming.length > 0 && (
            <>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">À venir</p>
              {upcoming.map((e) => <EventRow key={e.id} event={e} editingLink={editingLink} linkValue={linkValue} setEditingLink={setEditingLink} setLinkValue={setLinkValue} saveLiveLink={saveLiveLink} error={error} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mt-6">Passés</p>
              {past.map((e) => <EventRow key={e.id} event={e} editingLink={editingLink} linkValue={linkValue} setEditingLink={setEditingLink} setLinkValue={setLinkValue} saveLiveLink={saveLiveLink} error={error} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({ event, editingLink, linkValue, setEditingLink, setLinkValue, saveLiveLink, error }: {
  event: Event;
  editingLink: string | null;
  linkValue: string;
  setEditingLink: (id: string | null) => void;
  setLinkValue: (v: string) => void;
  saveLiveLink: (id: string) => void;
  error: string;
}) {
  const isEditing = editingLink === event.id;
  const isPast = event.event_date < new Date().toISOString();

  return (
    <div className={`bg-white border rounded-xl p-4 ${isPast ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            {new Date(event.event_date).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </div>
        </div>
        {!isPast && (
          <button
            onClick={() => {
              if (isEditing) {
                setEditingLink(null);
              } else {
                setEditingLink(event.id);
                setLinkValue(event.live_link ?? '');
              }
            }}
            className="text-xs text-indigo-600 hover:underline shrink-0"
          >
            {event.live_link ? 'Modifier lien' : 'Ajouter lien'}
          </button>
        )}
      </div>

      {event.live_link && !isEditing && (
        <a
          href={event.live_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:underline"
        >
          <LinkIcon className="w-3 h-3" />
          {event.live_link}
        </a>
      )}

      {isEditing && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="https://youtube.com/live/..."
            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
            autoFocus
          />
          <button
            onClick={() => saveLiveLink(event.id)}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
}
