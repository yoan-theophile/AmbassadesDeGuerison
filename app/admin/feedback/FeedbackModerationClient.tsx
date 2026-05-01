'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';

type Feedback = {
  id: string;
  visitor_email: string;
  direction: string;
  report_reason: string | null;
  report_status: string | null;
  report_handled_at: string | null;
  free_text: string | null;
  created_at: string;
  rating_welcome: number | null;
  rating_friendliness: number | null;
  rating_listening: number | null;
  rating_prayer: number | null;
  events: { title: string; event_date: string } | null;
  host_profiles: { first_name: string; city: string } | null;
};

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

interface Props { feedbacks: Feedback[] }

export default function FeedbackModerationClient({ feedbacks: initial }: Props) {
  const [feedbacks, setFeedbacks] = useState(initial);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

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

  const pending = feedbacks.filter((f) => f.report_status === 'pending');
  const other = feedbacks.filter((f) => f.report_status !== 'pending');

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Signalements</h1>
        <p className="text-slate-500 text-sm">{pending.length} en attente</p>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {toast}
        </div>
      )}

      {feedbacks.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Aucun signalement pour le moment.</p>
        </div>
      )}

      {[...pending, ...other].map((fb) => {
        const event = Array.isArray(fb.events) ? fb.events[0] : fb.events;
        const host = Array.isArray(fb.host_profiles) ? fb.host_profiles[0] : fb.host_profiles;
        const status = fb.report_status ?? 'pending';
        const isPending = status === 'pending';
        const isReviewing = status === 'reviewing';

        return (
          <div key={fb.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{fb.visitor_email}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {event?.title ?? 'Live'} — {host?.first_name}, {host?.city}
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
    </div>
  );
}
