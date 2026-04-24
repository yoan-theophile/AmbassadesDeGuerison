'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
}

interface Props {
  events: Event[];
  currentLive?: string;
  activeEventTitle?: string;
}

export default function TemoignageLiveFilter({ events, currentLive, activeEventTitle }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    router.push(val ? `/temoignages?live=${val}` : '/temoignages');
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={currentLive ?? ''}
          onChange={handleChange}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        >
          <option value="">Tous les lives</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </select>
        {currentLive && (
          <Link
            href="/temoignages"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Effacer ×
          </Link>
        )}
      </div>
      {activeEventTitle && (
        <p className="text-xs text-slate-400 mt-1.5">
          Filtré sur : <span className="text-slate-600 font-medium">{activeEventTitle}</span>
        </p>
      )}
    </div>
  );
}
