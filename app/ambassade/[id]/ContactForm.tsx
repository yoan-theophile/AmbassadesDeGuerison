'use client';

import { useState } from 'react';

interface Props {
  hostProfileId: string;
  hostName: string;
}

export default function ContactForm({ hostProfileId, hostName }: Props) {
  const [form, setForm] = useState({ visitor_name: '', visitor_email: '', message: '' });
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

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-gray-700 font-medium">Demande envoyée !</p>
        <p className="text-gray-500 text-sm mt-1">
          {hostName} va recevoir votre demande et vous transmettra l'adresse si disponible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Votre prénom *</label>
        <input
          type="text"
          value={form.visitor_name}
          onChange={(e) => set('visitor_name', e.target.value)}
          required
          className={inputCls}
          placeholder="Jean"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Votre e-mail *</label>
        <input
          type="email"
          value={form.visitor_email}
          onChange={(e) => set('visitor_email', e.target.value)}
          required
          className={inputCls}
          placeholder="jean@exemple.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
        <textarea
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          rows={2}
          className={inputCls}
          placeholder="Je serai avec ma famille de 3 personnes…"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !form.visitor_name || !form.visitor_email}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Envoi…' : 'Envoyer la demande'}
      </button>
    </form>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
