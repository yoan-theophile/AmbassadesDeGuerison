'use client';

import { useEffect, useState, useCallback } from 'react';

interface Signal {
  id: string;
  description: string;
  status: string;
  link_shared: boolean;
  created_at: string;
  host_profiles: {
    id: string;
    first_name: string;
    city: string;
    country: string;
  };
}

export default function AdminFeed({ eventId }: { eventId: string | null }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  const fetchSignals = useCallback(async () => {
    const url = eventId
      ? `/api/live-signals?status=pending&event_id=${eventId}`
      : `/api/live-signals?status=pending`;
    const res = await fetch(url);
    if (res.ok) setSignals(await res.json());
  }, [eventId]);

  // Polling 5s
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 5_000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  async function handleAction(id: string, action: 'approve' | 'decline') {
    setProcessing((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/live-signals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      // Retire le signal du feed
      setSignals((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">
          Signaux en attente ({signals.length})
        </h2>
        <span className="text-xs text-gray-400">Rafraîchissement auto toutes les 5s</span>
      </div>

      {signals.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎙️</p>
          <p>Aucun signal en attente</p>
        </div>
      )}

      <div className="space-y-3">
        {signals.map((signal) => {
          const hp = signal.host_profiles;
          const isProcessing = processing.has(signal.id);
          return (
            <div
              key={signal.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{hp.first_name}</span>
                    <span className="text-xs text-gray-400">
                      {hp.city}, {hp.country}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{signal.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(signal.created_at).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(signal.id, 'approve')}
                    disabled={isProcessing}
                    className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                  >
                    ✓ Approuver
                  </button>
                  <button
                    onClick={() => handleAction(signal.id, 'decline')}
                    disabled={isProcessing}
                    className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                  >
                    ✗ Refuser
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
