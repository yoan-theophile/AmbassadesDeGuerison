'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PowerOff } from 'lucide-react';

interface Props {
  eventId: string;
}

export default function LiveCloseButton({ eventId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClose() {
    if (!confirm('Clôturer le live ? Les pins disparaîtront de la carte publique.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/live/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert(`Erreur : ${error}`);
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <PowerOff className="w-3.5 h-3.5" />
        Live clôturé — pins retirés de la carte
      </span>
    );
  }

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      <PowerOff className="w-3.5 h-3.5" />
      {loading ? 'Clôture...' : 'Clôturer le live'}
    </button>
  );
}
