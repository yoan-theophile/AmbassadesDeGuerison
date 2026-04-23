'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  after:  'Après le live',
};

export default function TemoignagesAdmin({ temoignages }: { temoignages: Temoignage[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const visible = temoignages.filter((t) => {
    if (filter === 'visible') return t.is_visible;
    if (filter === 'hidden') return !t.is_visible;
    return true;
  });

  async function toggleVisibility(id: string, current: boolean) {
    setLoading(id);
    const supabase = createClient();
    await supabase.from('testimonials').update({ is_visible: !current }).eq('id', id);
    setLoading(null);
    startTransition(() => router.refresh());
  }

  const FILTERS = [
    { value: 'all' as const, label: 'Tous', count: temoignages.length },
    { value: 'visible' as const, label: 'Publiés', count: temoignages.filter((t) => t.is_visible).length },
    { value: 'hidden' as const, label: 'Non publiés', count: temoignages.filter((t) => !t.is_visible).length },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label} <span className="opacity-60 ml-1">{f.count}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun témoignage ici.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <div
              key={t.id}
              className={`bg-white border rounded-xl p-4 ${t.is_visible ? 'border-emerald-100' : 'border-slate-100'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-relaxed">{t.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    {t.host_profile?.[0] && (
                      <span className="font-medium text-slate-500">
                        {t.host_profile[0].first_name}, {t.host_profile[0].city}
                      </span>
                    )}
                    {t.timing && <span>{TIMING_LABELS[t.timing] ?? t.timing}</span>}
                    {t.event?.[0] && <span className="truncate">{t.event[0].title}</span>}
                    <span>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleVisibility(t.id, t.is_visible)}
                  disabled={loading === t.id}
                  title={t.is_visible ? 'Masquer' : 'Publier'}
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    t.is_visible
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {t.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
