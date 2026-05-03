'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, UserPlus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import CityInput from '@/components/ui/CityInput';
import CountrySelect from '@/components/ui/CountrySelect';
const TYPES = [
  { value: 'individual', label: 'Domicile / particulier' },
  { value: 'church', label: 'Église / lieu de culte' },
];

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    country: 'France',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    type: 'individual',
    capacity: '10',
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
      body: JSON.stringify({ ...form, capacity: parseInt(form.capacity, 10) }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.');
      setLoading(false);
      return;
    }

    setSubmitted(true);
  }

  const steps = ['Coordonnées', 'Lieu', 'Contact'];

  if (submitted) {
    return (
      <>
        <AppHeader />
        <main className="flex-1 bg-slate-50 px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Demande envoyée !</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Ta candidature est en cours d'examen. Tu recevras un e-mail dès qu'elle sera validée.
            </p>
            <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-indigo-600 text-sm hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Retour à la carte
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-slate-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à la carte
        </Link>

        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Devenir ambassadeur</h1>
          </div>
          <p className="text-sm text-slate-500 ml-9">Accueillez des personnes lors des lives de David Thery</p>

          <div className="flex items-center gap-1 mt-4 ml-9">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  i + 1 === step
                    ? 'bg-indigo-600 text-white'
                    : i + 1 < step
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {i + 1 < step && <CheckCircle2 className="w-3 h-3" />}
                  {s}
                </div>
                {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          {step === 1 && (
            <>
              <Field label="Prénom" required>
                <input type="text" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required className={inputCls} placeholder="Marie" />
              </Field>
              <Field label="Nom" required>
                <input type="text" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required className={inputCls} placeholder="Dupont" />
              </Field>
              <Field label="E-mail" required>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputCls} placeholder="marie@exemple.com" />
              </Field>
              <Field label="Téléphone" required>
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} required maxLength={20} className={inputCls} placeholder="+33 6 00 00 00 00" />
                <p className="text-xs text-slate-400 mt-1">Uniquement visible par l'équipe — jamais transmis aux visiteurs.</p>
              </Field>
              <CityInput
                label="Ville"
                id="city"
                required
                value={form.city}
                onChange={(city, lat, lng, country) =>
                  setForm((prev) => ({ ...prev, city, lat, lng, ...(country ? { country } : {}) }))
                }
              />
              {form.city && form.lat == null && (
                <p className="text-xs text-amber-600 -mt-1">
                  Sélectionnez votre ville dans la liste pour confirmer votre position sur la carte.
                </p>
              )}
              <CountrySelect
                label="Pays"
                id="country"
                required
                value={form.country}
                onChange={(country) => set('country', country)}
              />
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.first_name || !form.last_name || !form.email || !form.phone.trim() || !form.city || form.lat == null}
                className={`${btnPrimary} flex items-center gap-2 justify-center`}
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Type de lieu" required>
                <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Capacité d'accueil (personnes)" required>
                <input type="number" min="1" max="500" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} required className={inputCls} />
              </Field>
              <Field label="Adresse complète (privée)" required>
                <textarea value={form.address_private} onChange={(e) => set('address_private', e.target.value)} required rows={3} className={inputCls} placeholder="12 rue des Lilas, 69001 Lyon" />
              </Field>
              <Field label="Consignes d'accès (optionnel)">
                <textarea value={form.consignes} onChange={(e) => set('consignes', e.target.value)} rows={2} className={inputCls} placeholder="Sonner à l'interphone B. Parking gratuit en face." />
              </Field>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className={btnSecondary}>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setStep(3)} disabled={!form.address_private} className={`${btnPrimary} flex-1 flex items-center gap-2 justify-center`}>
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Lien groupe WhatsApp (optionnel)">
                <input type="url" value={form.whatsapp_group_url} onChange={(e) => set('whatsapp_group_url', e.target.value)} className={inputCls} placeholder="https://chat.whatsapp.com/..." />
              </Field>

              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 border border-slate-100">
                <p className="font-medium text-slate-800 mb-1">Récapitulatif</p>
                <p className="text-slate-600">{form.first_name} {form.last_name} — {form.city}, {form.country}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {TYPES.find((t) => t.value === form.type)?.label} · {form.capacity} personnes
                </p>
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <p className="text-xs text-slate-500 leading-relaxed">
                En soumettant cette demande, vous reconnaissez que l'équipe de David Thery se réserve le droit d'accepter ou de refuser toute candidature, sans avoir à en justifier les raisons.
              </p>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className={btnSecondary}>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button type="submit" disabled={loading} className={`${btnPrimary} flex-1`}>
                  {loading ? 'Envoi…' : 'Envoyer ma demande'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Déjà ambassadeur ?{' '}
          <Link href="/auth" className="text-indigo-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </main>
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';
const btnPrimary = 'w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors';
const btnSecondary = 'px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center';
