'use client';

import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';

interface Props {
  hostProfileId: string;
  hostName: string;
  contactMode: string;
}

export default function ContactForm({ hostProfileId, hostName, contactMode }: Props) {
  const [form, setForm] = useState({ visitor_first_name: '', visitor_email: '', visitor_message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/contact-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, host_profile_id: hostProfileId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.');
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  const contactHint: Record<string, string> = {
    email: 'par e-mail',
    whatsapp: 'via WhatsApp',
    telephone: 'par téléphone',
  };
  const hint = contactHint[contactMode] ?? 'prochainement';

  if (done) {
    return (
      <div className="text-center py-5">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <p className="text-slate-800 font-medium text-sm">Demande envoyée !</p>
        <p className="text-slate-500 text-xs mt-1 leading-relaxed">
          {hostName} va recevoir votre demande et vous contactera <strong className="text-slate-700">{hint}</strong> dans les 24 à 48 heures.
        </p>
        <p className="text-slate-400 text-xs mt-2">Un e-mail de confirmation vous a été envoyé.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Votre prénom *</label>
        <input type="text" value={form.visitor_first_name} onChange={(e) => set('visitor_first_name', e.target.value)} required className={inputCls} placeholder="Jean" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Votre e-mail *</label>
        <input type="email" value={form.visitor_email} onChange={(e) => set('visitor_email', e.target.value)} required className={inputCls} placeholder="jean@exemple.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Message (optionnel)</label>
        <textarea value={form.visitor_message} onChange={(e) => set('visitor_message', e.target.value)} rows={2} className={inputCls} placeholder="Je serai avec ma famille de 3 personnes…" />
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Envoi…' : 'Envoyer la demande'}
      </button>
    </form>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';
