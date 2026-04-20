'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg', 'Autre'];
const TYPES = [
  { value: 'domicile', label: 'Domicile' },
  { value: 'salle', label: 'Salle communautaire' },
  { value: 'eglise', label: 'Église / lieu de culte' },
  { value: 'autre', label: 'Autre' },
];
const CONTACT_MODES = [
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telephone', label: 'Téléphone' },
];

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    city: '',
    country: 'France',
    type: 'domicile',
    capacity: '10',
    contact_mode: 'email',
    address_private: '',
    whatsapp_group_url: '',
    consignes: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/inscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        capacity: parseInt(form.capacity, 10),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.');
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">Inscription envoyée !</h1>
          <p className="text-gray-600 mb-4">
            Merci {form.first_name}. Votre demande est en cours de validation. Vous recevrez un e-mail de confirmation.
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 text-sm underline"
          >
            Retour à la carte
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-indigo-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Devenir ambassadeur</h1>
          <p className="text-gray-500 text-sm mt-1">
            Accueillez des personnes lors des lives de David Thery
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-1.5 rounded-full ${s <= step ? 'bg-indigo-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {step === 1 && (
            <>
              <h2 className="font-semibold text-gray-800">Vos coordonnées</h2>
              <Field label="Prénom" required>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => set('first_name', e.target.value)}
                  required
                  className={inputCls}
                  placeholder="Marie"
                />
              </Field>
              <Field label="E-mail" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                  className={inputCls}
                  placeholder="marie@exemple.com"
                />
              </Field>
              <Field label="Ville" required>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  required
                  className={inputCls}
                  placeholder="Lyon"
                />
              </Field>
              <Field label="Pays" required>
                <select
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  className={inputCls}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.first_name || !form.email || !form.city}
                className={btnCls}
              >
                Continuer
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-gray-800">Votre lieu d'accueil</h2>
              <Field label="Type de lieu" required>
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value)}
                  className={inputCls}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Capacité d'accueil (personnes)" required>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={form.capacity}
                  onChange={(e) => set('capacity', e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Adresse complète (privée)" required>
                <textarea
                  value={form.address_private}
                  onChange={(e) => set('address_private', e.target.value)}
                  required
                  rows={3}
                  className={inputCls}
                  placeholder="12 rue des Lilas, 69001 Lyon"
                />
              </Field>
              <Field label="Consignes d'accès (optionnel)">
                <textarea
                  value={form.consignes}
                  onChange={(e) => set('consignes', e.target.value)}
                  rows={2}
                  className={inputCls}
                  placeholder="Sonner à l'interphone B. Parking gratuit en face."
                />
              </Field>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className={secondaryCls}>
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!form.address_private}
                  className={btnCls}
                >
                  Continuer
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-semibold text-gray-800">Contact &amp; finalisation</h2>
              <Field label="Mode de contact préféré" required>
                <select
                  value={form.contact_mode}
                  onChange={(e) => set('contact_mode', e.target.value)}
                  className={inputCls}
                >
                  {CONTACT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Lien groupe WhatsApp (optionnel)">
                <input
                  type="url"
                  value={form.whatsapp_group_url}
                  onChange={(e) => set('whatsapp_group_url', e.target.value)}
                  className={inputCls}
                  placeholder="https://chat.whatsapp.com/..."
                />
              </Field>

              <div className="bg-indigo-50 rounded-lg p-4 text-sm text-indigo-800">
                <p className="font-medium mb-1">Récapitulatif</p>
                <p>{form.first_name} — {form.city}, {form.country}</p>
                <p>{TYPES.find((t) => t.value === form.type)?.label} · {form.capacity} personnes</p>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className={secondaryCls}>
                  Retour
                </button>
                <button type="submit" disabled={loading} className={btnCls}>
                  {loading ? 'Envoi…' : "Envoyer ma demande"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const btnCls = 'flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50';
const secondaryCls = 'px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50';
