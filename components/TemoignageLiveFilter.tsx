'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  event_date?: string;
}

interface Props {
  events: Event[];
  currentLive?: string;
  activeEventTitle?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TemoignageLiveFilter({ events, currentLive, activeEventTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = events.find((e) => e.id === currentLive);

  const filtered = query.trim()
    ? events.filter((e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        (e.event_date && formatDate(e.event_date).toLowerCase().includes(query.toLowerCase()))
      )
    : events;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(id: string) {
    setOpen(false);
    setQuery('');
    router.push(id ? `/temoignages?live=${id}` : '/temoignages');
  }

  return (
    <div className="mb-6">
      <div ref={containerRef} className="relative inline-block min-w-[220px]">
        <button
          type="button"
          onClick={handleOpen}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition flex items-center justify-between gap-2"
        >
          <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
            {selected ? (
              <>
                <span className="font-medium">{selected.title}</span>
                {selected.event_date && (
                  <span className="text-slate-400 ml-1.5 text-xs">— {formatDate(selected.event_date)}</span>
                )}
              </>
            ) : (
              'Tous les lives'
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un live…"
                  className="w-full pl-7 pr-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 bg-slate-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <ul className="max-h-52 overflow-y-auto">
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 ${
                    !currentLive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  Tous les lives
                </button>
              </li>
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-400 text-center">Aucun résultat</li>
              ) : (
                filtered.map((ev) => (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(ev.id); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 ${
                        ev.id === currentLive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      <span className="font-medium block leading-snug">{ev.title}</span>
                      {ev.event_date && (
                        <span className="text-xs text-slate-400">{formatDate(ev.event_date)}</span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {currentLive && (
        <Link
          href="/temoignages"
          className="ml-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Effacer ×
        </Link>
      )}

      {activeEventTitle && (
        <p className="text-xs text-slate-400 mt-1.5">
          Filtré sur : <span className="text-slate-600 font-medium">{activeEventTitle}</span>
        </p>
      )}
    </div>
  );
}
