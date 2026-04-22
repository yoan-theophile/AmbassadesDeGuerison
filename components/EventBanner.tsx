'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
}

interface Props {
  nextEvent: EventInfo | null;
  lastEvent: EventInfo | null;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}j ${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h ${minutes}min ${seconds}s`;
  return `${minutes}min ${seconds}s`;
}

export default function EventBanner({ nextEvent, lastEvent }: Props) {
  const [countdown, setCountdown] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!nextEvent) return;
    const tick = () => {
      const ms = new Date(nextEvent.event_date).getTime() - Date.now();
      setCountdown(formatCountdown(ms));
      setNow(Date.now());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextEvent]);

  if (!nextEvent && !lastEvent) return null;

  let message: string;
  let isUrgent = false;

  if (nextEvent) {
    const msLeft = new Date(nextEvent.event_date).getTime() - now;
    const daysLeft = msLeft / (1000 * 60 * 60 * 24);

    if (daysLeft < 7 && countdown) {
      message = `Prochain live dans ${countdown}`;
      isUrgent = true;
    } else {
      const date = new Date(nextEvent.event_date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
      message = `Prochain live le ${date}`;
    }
  } else if (lastEvent) {
    const daysAgo = Math.floor(
      (Date.now() - new Date(lastEvent.event_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    message = `Dernier live il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''} — prochainement`;
  } else {
    return null;
  }

  return (
    <div
      className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full shadow-md text-sm font-medium whitespace-nowrap ${
        isUrgent
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-slate-700 border border-slate-100'
      }`}
    >
      <Radio className={`w-3.5 h-3.5 ${isUrgent ? 'text-indigo-200 animate-pulse' : 'text-indigo-400'}`} />
      {message}
    </div>
  );
}
