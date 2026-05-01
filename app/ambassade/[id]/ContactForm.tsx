'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Send } from 'lucide-react';
import PhoneInput from '@/components/ui/PhoneInput';

interface Props {
  hostProfileId: string;
  hostName: string;
  contactMode: string;
  eventId: string | null;
}

export default function ContactForm({ hostProfileId, hostName, contactMode, eventId }: Props) {
  const [form, setForm] = useState({
    visitor_first_name: '',
    visitor_email: '',
    visitor_phone: '',
    nb_personnes: 1,
    visitor_message: '',
    visitor_notifications_optin: true,
  });
  const [loading, setLoading] = useState(false);
  const [actionToken, setActionToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/visit-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host_profile_id: hostProfileId,
        event_id: eventId,
        first_name: form.visitor_first_name,
        email: form.visitor_email,
        phone: form.visitor_phone || null,
        nb_personnes: form.nb_personnes,
        message: form.visitor_message || null,
        consent: form.visitor_notifications_optin,
        website: '', // honeypot
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.');
    } else {
      setActionToken(data.action_token);
    }
    setLoading(false);
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencieux
    }
  }

  if (!eventId) {
    return (
      <p className="text-slate-500 text-sm text-center py-2">
        Aucun live à venir pour cette ambassade pour le moment.
      </p>
    );
  }

  if (actionToken) {
    const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/visitor/${actionToken}`;
    return (
      <div className="py-4 space-y-4">
        <div className="text-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-slate-800 font-medium text-sm">Demande envoyée !</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            L'adresse de {hostName} sera disponible dans 24 heures.
          </p>
        </div>

        <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
          <p className="text-indigo-800 text-xs font-medium">Votre lien d'invitation</p>
          <p className="text-indigo-600 text-xs break-all font-mono">{inviteUrl}</p>
          <div className="flex gap-2">
            <button
              onClick={() => copyLink(inviteUrl)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-medium py-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <a
              href={inviteUrl}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Accéder
            </a>
          </div>
        </div>

        <p className="text-slate-400 text-xs text-center">Un e-mail vous a également été envoyé.</p>
      </div>
    );
  }

  const contactHint: Record<string, string> = {
    email: 'par e-mail',
    whatsapp: 'via WhatsApp',
    telephone: 'par téléphone',
  };
  const hint = contactHint[contactMode] ?? 'prochainement';

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
      <PhoneInput
        label="Téléphone (optionnel)"
        id="visitor_phone"
        value={form.visitor_phone}
        onChange={(v) => set('visitor_phone', v)}
        placeholder="+33 6 12 34 56 78"
      />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de personnes</label>
        <input
          type="number"
          min={1}
          max={20}
          value={form.nb_personnes}
          onChange={(e) => set('nb_personnes', Math.max(1, parseInt(e.target.value) || 1))}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Message (optionnel)</label>
        <textarea value={form.visitor_message} onChange={(e) => set('visitor_message', e.target.value)} rows={2} className={inputCls} placeholder="Je serai avec ma famille de 3 personnes…" />
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.visitor_notifications_optin}
          onChange={(e) => set('visitor_notifications_optin', e.target.checked)}
          className="mt-0.5 accent-indigo-600"
        />
        <span className="text-xs text-slate-500">
          Je souhaite être informé(e) des prochains lives de David Théry.
        </span>
      </label>

      {/* Honeypot — invisible */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <p className="text-slate-400 text-xs">
        Coordonnées transmises {hint} — disponibles dans 24 heures.
      </p>

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
