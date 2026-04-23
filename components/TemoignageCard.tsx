'use client';

import { useState, useRef, useEffect } from 'react';
import { Quote } from 'lucide-react';

const TIMING_LABELS: Record<string, string> = {
  during: 'Pendant le live',
  after:  'Après le live',
};

interface Props {
  content: string;
  hostName: string | null;
  eventTitle: string | null;
  timing: string | null;
}

export default function TemoignageCard({ content, hostName, eventTitle, timing }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 2);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
      <Quote className="w-5 h-5 text-indigo-300 mb-2 shrink-0" />
      <p
        ref={ref}
        className={`text-slate-700 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}
      >
        {content}
      </p>

      {clamped && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs text-indigo-500 hover:underline self-start"
        >
          Lire la suite
        </button>
      )}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-1 text-xs text-indigo-500 hover:underline self-start"
        >
          Réduire
        </button>
      )}

      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-500">{hostName ?? 'Ambassadeur'}</span>
          {timing && <span>{TIMING_LABELS[timing] ?? timing}</span>}
        </div>
        {eventTitle && <p className="text-xs text-indigo-400 truncate">{eventTitle}</p>}
      </div>
    </div>
  );
}
