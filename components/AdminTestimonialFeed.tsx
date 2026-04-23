'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Check, X } from 'lucide-react';

interface Testimonial {
  id: string;
  content: string;
  timing: string;
  created_at: string;
  visitor_name: string | null;
  host_profiles: {
    first_name: string;
    city: string;
    country: string;
  } | null;
}

export default function AdminTestimonialFeed({ eventId }: { eventId: string | null }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    setRefreshing(true);
    try {
      const base = '/api/testimonials?is_visible=false';
      const url = eventId ? `${base}&event_id=${eventId}` : base;
      const res = await fetch(url);
      if (res.ok) setTestimonials(await res.json());
    } finally {
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchTestimonials();
    const interval = setInterval(fetchTestimonials, 10_000);
    return () => clearInterval(interval);
  }, [fetchTestimonials]);

  async function handleAction(id: string, action: 'approve' | 'decline') {
    setProcessing((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700">
          Témoignages en attente ({testimonials.length})
        </h2>
        {refreshing && (
          <svg className="animate-spin w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm">Aucun témoignage en attente</p>
        </div>
      )}

      <div className="space-y-3">
        {testimonials.map((t) => {
          const hp = t.host_profiles;
          const isProcessing = processing.has(t.id);
          const author = hp
            ? `${hp.first_name} — ${hp.city}, ${hp.country}`
            : t.visitor_name
            ? `${t.visitor_name} (visiteur)`
            : 'Visiteur anonyme';

          return (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800 text-sm">{author}</span>
                    {t.timing === 'during' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Pendant le live
                      </span>
                    )}
                  </div>
                  <blockquote className="text-slate-700 text-sm italic">"{t.content}"</blockquote>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(t.created_at).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(t.id, 'approve')}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Publier
                  </button>
                  <button
                    onClick={() => handleAction(t.id, 'decline')}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Refuser
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
