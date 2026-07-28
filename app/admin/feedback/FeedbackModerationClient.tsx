'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { AlertTriangle, CheckCircle2, Clock, X, Star, ThumbsUp, ThumbsDown } from 'lucide-react';

type Feedback = {
  id: string;
  visitor_email: string;
  direction: string;
  reported: boolean;
  report_reason: string | null;
  report_status: string | null;
  report_handled_at: string | null;
  free_text: string | null;
  created_at: string;
  would_host_again: boolean | null;
  rating_welcome: number | null;
  rating_friendliness: number | null;
  rating_listening: number | null;
  rating_prayer: number | null;
  events: { id: string; title: string; event_date: string } | { id: string; title: string; event_date: string }[] | null;
  host_profiles: { first_name: string; city: string } | { first_name: string; city: string }[] | null;
};

function one<T>(v: T | T[] | null): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  reviewing: 'En cours',
  resolved:  'Résolu',
  dismissed: 'Classé',
};

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  reviewing: 'bg-indigo-50 text-indigo-700',
  resolved:  'bg-emerald-50 text-emerald-700',
  dismissed: 'bg-slate-50 text-slate-500',
};

function averageRating(fb: Feedback): number | null {
  const ratings = [fb.rating_welcome, fb.rating_friendliness, fb.rating_listening, fb.rating_prayer].filter(
    (r): r is number => r != null
  );
  if (ratings.length === 0) return null;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

interface Props { feedbacks: Feedback[] }

export default function FeedbackModerationClient({ feedbacks: initial }: Props) {
  const [feedbacks, setFeedbacks] = useState(initial);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<'signalements' | 'notations'>('signalements');

  // Filtres — onglet "Toutes les notations" (D.6 : tri par live, tri par score)
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'visitor_to_host' | 'host_to_visitor'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'score'>('recent');

  // Realtime : nouveaux signalements
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('reports')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_feedbacks',
        filter: 'reported=eq.true',
      }, (payload) => {
        setFeedbacks((prev) => [payload.new as Feedback, ...prev]);
        setToast('Nouveau signalement reçu');
        setTimeout(() => setToast(null), 4000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleAction(id: string, action: 'reviewing' | 'resolved' | 'dismissed') {
    setSubmitting((s) => ({ ...s, [id]: true }));
    const res = await fetch(`/api/admin/feedbacks/${id}/handle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, resolution: resolution[id] }),
    });
    if (res.ok) {
      setFeedbacks((prev) => prev.map((f) =>
        f.id === id ? { ...f, report_status: action } : f
      ));
    }
    setSubmitting((s) => ({ ...s, [id]: false }));
  }

  const reportedFeedbacks = feedbacks.filter((f) => f.reported);
  const pending = reportedFeedbacks.filter((f) => f.report_status === 'pending');
  const other = reportedFeedbacks.filter((f) => f.report_status !== 'pending');

  const events = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of feedbacks) {
      const ev = one(f.events);
      if (ev?.id) map.set(ev.id, ev.title);
    }
    return [...map.entries()];
  }, [feedbacks]);

  const filteredNotations = useMemo(() => {
    let list = [...feedbacks];
    if (eventFilter !== 'all') list = list.filter((f) => one(f.events)?.id === eventFilter);
    if (directionFilter !== 'all') list = list.filter((f) => f.direction === directionFilter);
    if (sortBy === 'score') {
      list.sort((a, b) => (averageRating(b) ?? -1) - (averageRating(a) ?? -1));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [feedbacks, eventFilter, directionFilter, sortBy]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Retours post-live</h1>
        <p className="text-slate-500 text-sm">{pending.length} signalement{pending.length !== 1 ? 's' : ''} en attente</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('signalements')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'signalements' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Signalements
        </button>
        <button
          onClick={() => setTab('notations')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'notations' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Toutes les notations ({feedbacks.length})
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {toast}
        </div>
      )}

      {tab === 'signalements' && (
        <>
          {reportedFeedbacks.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Aucun signalement pour le moment.</p>
            </div>
          )}

          {[...pending, ...other].map((fb) => {
            const host = one(fb.host_profiles);
            const status = fb.report_status ?? 'pending';
            const isPending = status === 'pending';
            const isReviewing = status === 'reviewing';

            return (
              <div key={fb.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{fb.visitor_email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {one(fb.events)?.title ?? 'Live'} — {host?.first_name}, {host?.city}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </div>

                {fb.report_reason && (
                  <div className="bg-red-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-red-700 font-medium mb-1">Motif signalé</p>
                    <p className="text-sm text-red-800">{fb.report_reason}</p>
                  </div>
                )}

                {fb.free_text && (
                  <p className="text-slate-600 text-sm italic">"{fb.free_text}"</p>
                )}

                {(isPending || isReviewing) && (
                  <div className="space-y-3 pt-2 border-t border-slate-50">
                    <textarea
                      value={resolution[fb.id] ?? ''}
                      onChange={(e) => setResolution((r) => ({ ...r, [fb.id]: e.target.value }))}
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-white"
                      placeholder="Note de résolution (optionnelle)…"
                    />
                    <div className="flex gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleAction(fb.id, 'reviewing')}
                          disabled={submitting[fb.id]}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Prendre en charge
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(fb.id, 'resolved')}
                        disabled={submitting[fb.id]}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Résoudre
                      </button>
                      <button
                        onClick={() => handleAction(fb.id, 'dismissed')}
                        disabled={submitting[fb.id]}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Classer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {tab === 'notations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">Tous les lives</option>
              {events.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as typeof directionFilter)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">Visiteurs et ambassadeurs</option>
              <option value="visitor_to_host">Visiteur → ambassade</option>
              <option value="host_to_visitor">Ambassade → visiteur</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="recent">Plus récents</option>
              <option value="score">Meilleure note</option>
            </select>
          </div>

          {filteredNotations.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
              <p className="text-slate-500 text-sm">Aucune notation pour ces filtres.</p>
            </div>
          )}

          {filteredNotations.map((fb) => {
            const host = one(fb.host_profiles);
            const avg = averageRating(fb);
            return (
              <div key={fb.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{fb.visitor_email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {one(fb.events)?.title ?? 'Live'} — {host?.first_name}, {host?.city}
                    </p>
                  </div>
                  {fb.direction === 'visitor_to_host' && avg != null && (
                    <span className="flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">
                      <Star className="w-3.5 h-3.5 fill-indigo-600" />
                      {avg.toFixed(1)}/5
                    </span>
                  )}
                  {fb.direction === 'host_to_visitor' && fb.would_host_again != null && (
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${fb.would_host_again ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'}`}>
                      {fb.would_host_again ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                      {fb.would_host_again ? 'Reviendrait' : 'Ne reviendrait pas'}
                    </span>
                  )}
                </div>
                {fb.free_text && <p className="text-slate-600 text-sm italic">"{fb.free_text}"</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
