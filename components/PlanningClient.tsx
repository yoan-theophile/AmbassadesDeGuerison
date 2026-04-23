'use client';

import { useState, useTransition } from 'react';
import { Plus, Link as LinkIcon, Calendar, Search, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  event_date: string;
  live_link: string | null;
  description: string | null;
}

type Filter = 'upcoming' | 'past';

export default function PlanningClient({ events }: { events: Event[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('upcoming');

  const now = new Date().toISOString();

  // Server sends ascending; upcoming = soonest first, past reversed = most recent first
  const upcomingAll = events.filter((e) => e.event_date >= now);
  const pastAll = [...events.filter((e) => e.event_date < now)].reverse();

  const displayed = filter === 'upcoming' ? upcomingAll : pastAll;
  const filtered = search.trim()
    ? displayed.filter((e) => {
        const haystack = [e.title, e.description, e.live_link]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return search.trim().toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
      })
    : displayed;

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

  async function updateEvent(formData: FormData) {
    if (!editingEvent) return;
    setError('');
    const title = (formData.get('title') as string).trim();
    const event_date = formData.get('event_date') as string;
    const live_link = (formData.get('live_link') as string).trim() || null;

    if (!title || !event_date) { setError('Titre et date sont requis.'); return; }

    const supabase = createClient();
    const { error: err } = await supabase
      .from('events')
      .update({ title, event_date, live_link })
      .eq('id', editingEvent.id);
    if (err) { setError(err.message); return; }

    setEditingEvent(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-slate-500">{upcomingAll.length} à venir · {pastAll.length} passés</p>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau live
        </button>
      </div>

      {/* Create form */}
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
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Date et heure</label>
            <input
              name="event_date"
              type="datetime-local"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Lien du live (optionnel)</label>
            <input
              name="live_link"
              placeholder="https://youtube.com/live/..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
              onClick={() => { setShowForm(false); setError(''); }}
              className="text-slate-500 px-4 py-2 rounded-lg text-sm hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          À venir
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            filter === 'past'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Passés
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un live…"
          className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun événement. Créez le premier live.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun live trouvé.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) =>
            editingEvent?.id === e.id ? (
              <form
                key={e.id}
                action={updateEvent}
                className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3"
              >
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Titre</label>
                  <input
                    name="title"
                    defaultValue={editingEvent.title}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Date et heure</label>
                  <input
                    name="event_date"
                    type="datetime-local"
                    defaultValue={editingEvent.event_date.slice(0, 16)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Lien du live (optionnel)</label>
                  <input
                    name="live_link"
                    defaultValue={editingEvent.live_link ?? ''}
                    placeholder="https://youtube.com/live/..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingEvent(null); setError(''); }}
                    className="text-slate-500 px-4 py-1.5 rounded-lg text-sm hover:bg-slate-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <EventRow key={e.id} event={e} onEdit={() => setEditingEvent(e)} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({ event, onEdit }: { event: Event; onEdit: () => void }) {
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
          {event.live_link && (
            <a
              href={event.live_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-xs text-indigo-600 hover:underline"
            >
              <LinkIcon className="w-3 h-3" />
              {event.live_link}
            </a>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline shrink-0"
        >
          <Pencil className="w-3 h-3" />
          Modifier
        </button>
      </div>
    </div>
  );
}
