'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, Mail } from 'lucide-react';

// Confirmation des actions irréversibles ou visibles publiquement.
//
// Motivation (audit admin 2026-08-07, T.1 et T.3) : refuser un candidat,
// retirer un admin, débloquer un utilisateur ou clôturer un live s'effectuaient
// en un clic, sans confirmation — et surtout sans jamais dire que l'action
// envoie un e-mail à une personne réelle. Quatre actions de l'admin déclenchent
// un envoi irréversible ; aucune ne le signalait.
//
// `emailNotice` matérialise cette convention : toute action qui envoie un
// e-mail doit le mentionner ici.
//
// Remplace `confirm()` natif (utilisé jusqu'ici par LiveCloseButton), qui ne
// permet ni de distinguer une action destructive d'une action neutre, ni
// d'annoncer un envoi d'e-mail.

export type ConfirmSpec = {
  title: string;
  body?: string;
  emailNotice?: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
};

export default function ConfirmDialog({
  spec,
  onCancel,
  pending = false,
}: {
  spec: ConfirmSpec | null;
  onCancel: () => void;
  pending?: boolean;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!spec) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [spec, onCancel]);

  if (!spec) return null;

  const danger = spec.tone !== 'primary';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${danger ? 'bg-red-50' : 'bg-indigo-50'}`}>
            <AlertTriangle className={`w-4 h-4 ${danger ? 'text-red-500' : 'text-indigo-500'}`} />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-sm font-semibold text-slate-800">{spec.title}</h2>
            {spec.body && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{spec.body}</p>}
          </div>
        </div>

        {spec.emailNotice && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <Mail className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-900 leading-relaxed">{spec.emailNotice}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={pending}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            ref={confirmRef}
            onClick={spec.onConfirm}
            disabled={pending}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              danger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600'
            }`}
          >
            {pending ? '…' : spec.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
