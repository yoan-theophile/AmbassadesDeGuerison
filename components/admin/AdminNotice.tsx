import type { ReactNode } from 'react';
import { AlertTriangle, Info, PauseCircle } from 'lucide-react';

// Bandeau d'information contextuel.
//
// Motivation (audit admin 2026-08-07) : plusieurs écrans présentaient comme
// opérationnelles des mécaniques qui ne le sont pas (campagnes et feedbacks
// dépendent de crons désactivés dans `vercel.json`). Un admin planifiait un
// envoi puis attendait un e-mail qui ne partait jamais.
//
// `paused` est le ton réservé à ce cas : la fonctionnalité existe et son code
// tourne, mais rien ne la déclenche aujourd'hui.

const TONES = {
  info:    { wrap: 'bg-slate-50 border-slate-200 text-slate-700',  icon: 'text-slate-400', Icon: Info },
  warning: { wrap: 'bg-amber-50 border-amber-200 text-amber-900',  icon: 'text-amber-500', Icon: AlertTriangle },
  paused:  { wrap: 'bg-amber-50 border-amber-200 text-amber-900',  icon: 'text-amber-500', Icon: PauseCircle },
} as const;

export default function AdminNotice({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { wrap, icon, Icon } = TONES[tone];

  return (
    <div className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${wrap} ${className}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${icon}`} />
      <div className="text-sm min-w-0">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
