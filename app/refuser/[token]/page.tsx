'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function RefuserPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<'loading' | 'confirm' | 'done' | 'already' | 'error'>('loading');
  const [names, setNames] = useState<{ visitor_first_name: string; host_first_name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/contact-requests/${token}/decline`)
      .then((r) => r.json())
      .then((d) => {
        if (d.already_declined) { setStep('already'); return; }
        if (d.error) { setStep('error'); return; }
        setNames(d);
        setStep('confirm');
      })
      .catch(() => setStep('error'));
  }, [token]);

  async function handleDecline() {
    setSubmitting(true);
    const res = await fetch(`/api/contact-requests/${token}/decline`, { method: 'POST' });
    const d = await res.json();
    if (res.ok || d.already_declined) {
      setStep('done');
    } else {
      setStep('error');
    }
    setSubmitting(false);
  }

  if (step === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
          Chargement…
        </div>
      </main>
    );
  }

  if (step === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-1">Lien invalide ou expiré</p>
          <p className="text-slate-400 text-sm">Ce lien est valable 7 jours.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 text-sm hover:underline">Retour à la carte</Link>
        </div>
      </main>
    );
  }

  if (step === 'already' || step === 'done') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-800 font-medium mb-1">Demande refusée</p>
          <p className="text-slate-500 text-sm">
            {step === 'already' ? 'Cette demande avait déjà été refusée.' : 'Le visiteur en a été informé par e-mail.'}
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-indigo-600 text-sm hover:underline">Mon espace</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-sm w-full text-center">
        <p className="text-slate-800 font-semibold text-lg mb-2">Refuser la demande de {names?.visitor_first_name} ?</p>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          {names?.visitor_first_name} sera prévenu par e-mail et pourra chercher une autre ambassade.
        </p>
        <button
          onClick={handleDecline}
          disabled={submitting}
          className="w-full bg-red-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-red-700 disabled:opacity-50 transition-colors mb-3"
        >
          {submitting ? 'En cours…' : 'Oui, refuser cette demande'}
        </button>
        <Link href="/dashboard" className="block text-slate-400 text-sm hover:text-slate-600 transition-colors">
          Annuler — retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
