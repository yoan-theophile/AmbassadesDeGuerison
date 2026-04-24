'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Eye, EyeOff, Trash2, Search, ChevronLeft, ChevronRight, X, Tv2, Link2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

interface Temoignage {
  id: string;
  content: string;
  timing: string | null;
  is_visible: boolean;
  created_at: string;
  host_profile: { first_name: string; city: string }[] | null;
  event: { title: string }[] | null;
}

const TIMING_LABELS: Record<string, string> = {
  during: 'Pendant le live',
  after: 'Après le live',
};

type Filter = 'all' | 'visible' | 'hidden';
type PageSize = 10 | 20 | 50;

function EventCombobox({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  const displayValue = open ? query : value;
  const visible = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative min-w-[180px]">
      <input
        value={displayValue}
        placeholder="Tous les lives"
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange('');
        }}
        onFocus={() => setOpen(true)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(''); setQuery(''); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
              !value ? 'text-indigo-600 font-medium' : 'text-slate-500'
            }`}
          >
            Tous les lives
          </button>
          {visible.map((title) => (
            <button
              key={title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(title); setQuery(''); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 truncate ${
                value === title ? 'text-indigo-600 font-medium' : 'text-slate-700'
              }`}
            >
              {title}
            </button>
          ))}
          {visible.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-400">Aucun live trouvé</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TemoignagesAdmin({
  temoignages,
  initialEventTitle,
}: {
  temoignages: Temoignage[];
  initialEventTitle?: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(temoignages);
  const [filter, setFilter] = useState<Filter>(initialEventTitle ? 'all' : 'hidden');
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState(initialEventTitle ?? '');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);
  const [batchLoading, setBatchLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const eventTitles = Array.from(
    new Set(items.map((t) => t.event?.[0]?.title).filter(Boolean) as string[])
  ).sort();

  const byEvent = eventFilter
    ? items.filter((t) => t.event?.[0]?.title === eventFilter)
    : items;

  const byTab = byEvent.filter((t) => {
    if (filter === 'visible') return t.is_visible;
    if (filter === 'hidden') return !t.is_visible;
    return true;
  });

  const filtered = search.trim()
    ? byTab.filter((t) => {
        const haystack = [
          t.content,
          t.host_profile?.[0]?.first_name,
          t.host_profile?.[0]?.city,
          t.event?.[0]?.title,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return search
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .every((word) => haystack.includes(word));
      })
    : byTab;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetPage() {
    setPage(1);
  }

  async function toggleVisibility(id: string, current: boolean) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, is_visible: !current } : t)));
    const supabase = createClient();
    const { error } = await supabase
      .from('testimonials')
      .update({ is_visible: !current })
      .eq('id', id);
    if (error) {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, is_visible: current } : t)));
    }
  }

  async function deleteTestimonial(id: string) {
    setConfirmDelete(null);
    setItems((prev) => prev.filter((t) => t.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) startTransition(() => router.refresh());
  }

  async function publishAll() {
    const ids = filtered.map((t) => t.id);
    if (ids.length === 0) return;
    setBatchLoading(true);
    setItems((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, is_visible: true } : t)));
    const supabase = createClient();
    const { error } = await supabase
      .from('testimonials')
      .update({ is_visible: true })
      .in('id', ids);
    if (error) startTransition(() => router.refresh());
    setBatchLoading(false);
  }

  const FILTER_TABS: { value: Filter; label: string }[] = [
    { value: 'hidden', label: 'Non publiés' },
    { value: 'visible', label: 'Publiés' },
    { value: 'all', label: 'Tous' },
  ];

  const pendingCount = eventFilter
    ? byEvent.filter((t) => !t.is_visible).length
    : 0;

  const statsSource = eventFilter ? byEvent : items;
  const statsPublished = statsSource.filter((t) => t.is_visible).length;
  const statsCities = new Set(
    statsSource.map((t) => t.host_profile?.[0]?.city).filter(Boolean) as string[]
  ).size;

  function handleCopyLink() {
    const url = `${window.location.origin}/temoignages`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-2xl">

      {/* Bandeau live actif */}
      {eventFilter && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <Tv2 className="w-4 h-4 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-0.5">Live sélectionné</p>
            <p className="text-sm font-semibold text-indigo-900 truncate">{eventFilter}</p>
          </div>
          {pendingCount > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              {pendingCount} en attente
            </span>
          )}
          <button
            onClick={() => { setEventFilter(''); resetPage(); }}
            title="Voir tous les témoignages"
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-indigo-300 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats + lien partage */}
      <div className="flex items-center gap-4 mb-4 px-1 flex-wrap">
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-slate-800">{statsSource.length}</span>{' '}
          témoignage{statsSource.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-emerald-600">{statsPublished}</span> publié{statsPublished !== 1 ? 's' : ''}
        </span>
        {statsCities > 0 && (
          <span className="text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{statsCities}</span> ville{statsCities !== 1 ? 's' : ''}
          </span>
        )}
        <button
          onClick={handleCopyLink}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? 'Lien copié !' : 'Copier le lien'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_TABS.map((f) => {
          const count =
            f.value === 'all'
              ? byEvent.length
              : f.value === 'visible'
              ? byEvent.filter((t) => t.is_visible).length
              : byEvent.filter((t) => !t.is_visible).length;
          return (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); resetPage(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label} <span className="opacity-60 ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Recherche + filtre live */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="Rechercher dans les témoignages…"
            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        {eventTitles.length > 0 && (
          <EventCombobox
            options={eventTitles}
            value={eventFilter}
            onChange={(v) => { setEventFilter(v); resetPage(); }}
          />
        )}
      </div>

      {/* Tout publier + sélecteur pagination */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div>
          {filter === 'hidden' && filtered.length > 0 && (
            <button
              onClick={publishAll}
              disabled={batchLoading}
              className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {batchLoading ? 'Publication…' : `Tout publier (${filtered.length})`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{total} résultat{total !== 1 ? 's' : ''}</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value) as PageSize); resetPage(); }}
            className="border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-600 focus:outline-none"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {paginated.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun témoignage ici.</p>
      ) : (
        <div className="space-y-3">
          {paginated.map((t) => (
            <div
              key={t.id}
              className={`bg-white border rounded-xl p-4 ${
                t.is_visible ? 'border-emerald-100' : 'border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-relaxed">{t.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    {t.host_profile?.[0] && (
                      <span className="font-medium text-slate-600">
                        {t.host_profile[0].first_name}, {t.host_profile[0].city}
                      </span>
                    )}
                    {t.timing && <span>{TIMING_LABELS[t.timing] ?? t.timing}</span>}
                    {t.event?.[0] && (
                      <span className="text-indigo-500 truncate">{t.event[0].title}</span>
                    )}
                    <span>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                {confirmDelete === t.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-red-600 font-medium">Supprimer ?</span>
                    <button
                      onClick={() => deleteTestimonial(t.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleVisibility(t.id, t.is_visible)}
                      title={t.is_visible ? 'Masquer' : 'Publier'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        t.is_visible
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {t.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(t.id)}
                      title="Supprimer définitivement"
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex items-center gap-1 text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Précédent
          </button>
          <span className="text-xs text-slate-400">{safePage} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex items-center gap-1 text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Suivant
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
