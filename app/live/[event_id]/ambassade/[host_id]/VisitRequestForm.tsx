'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import PhoneInput from '@/components/ui/PhoneInput';

interface Props {
  eventId: string;
  hostProfileId: string;
  hostName: string;
}

export default function VisitRequestForm({ eventId, hostProfileId, hostName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'identity' | 'logistics' | 'message' | 'consent'>('identity');
  const [form, setForm] = useState({
    visitor_first_name: '',
    visitor_email: '',
    visitor_phone: '',
    nb_personnes: 1,
    visitor_message: '',
    visitor_notifications_optin: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/visit-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        host_profile_id: hostProfileId,
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
      setLoading(false);
    } else {
      router.push(`/visitor/${data.action_token}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Étape : identité */}
      <fieldset>
        <legend className="text-xs text-slate-400 uppercase tracking-wide mb-3">Identité</legend>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Votre prénom *</label>
            <input
              type="text"
              value={form.visitor_first_name}
              onChange={(e) => set('visitor_first_name', e.target.value)}
              required
              className={inputCls}
              placeholder="Marie"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Votre e-mail *</label>
            <input
              type="email"
              value={form.visitor_email}
              onChange={(e) => set('visitor_email', e.target.value)}
              required
              className={inputCls}
              placeholder="marie@exemple.com"
            />
            <p className="text-xs text-slate-400 mt-1">Utilisé uniquement pour vous informer de la réponse de l'ambassadeur.</p>
          </div>
        </div>
      </fieldset>

      {/* Étape : logistique */}
      <fieldset>
        <legend className="text-xs text-slate-400 uppercase tracking-wide mb-3">Logistique</legend>
        <div className="space-y-3">
          <div>
            <PhoneInput
              label="Téléphone (optionnel)"
              id="visitor_phone"
              value={form.visitor_phone}
              onChange={(v) => set('visitor_phone', v)}
              placeholder="+33 6 12 34 56 78"
            />
            <p className="text-xs text-slate-400 mt-1">Permet à l'ambassadeur de vous appeler en cas d'imprévu le jour J.</p>
          </div>
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
        </div>
      </fieldset>

      {/* Étape : message */}
      <fieldset>
        <legend className="text-xs text-slate-400 uppercase tracking-wide mb-3">Message</legend>
        <textarea
          value={form.visitor_message}
          onChange={(e) => set('visitor_message', e.target.value)}
          rows={3}
          className={inputCls}
          placeholder={`Un mot pour ${hostName} (optionnel) — présentation, situation particulière…`}
        />
      </fieldset>

      {/* Consentement */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.visitor_notifications_optin}
          onChange={(e) => set('visitor_notifications_optin', e.target.checked)}
          className="mt-0.5 accent-indigo-600"
        />
        <span className="text-xs text-slate-500 leading-relaxed">
          Je souhaite être informé(e) des prochains lives de David Théry.
        </span>
      </label>

      {/* Honeypot */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <p className="text-slate-400 text-xs leading-relaxed">
        L'ambassadeur se réserve le droit d'accepter ou non votre demande.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Envoi…' : 'Envoyer ma demande'}
      </button>
    </form>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';
