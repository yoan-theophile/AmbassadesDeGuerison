'use client';

import { useState } from 'react';
import { Settings, CheckCircle2, Loader2 } from 'lucide-react';
import CityInput from '@/components/ui/CityInput';
import CountrySelect from '@/components/ui/CountrySelect';
import PhoneInput from '@/components/ui/PhoneInput';

interface Profile {
  city: string;
  country: string;
  address_private?: string | null;
  consignes?: string | null;
  phone?: string | null;
  quartier?: string | null;
}

export default function MesInfosSection({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    city: profile.city,
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    country: profile.country,
    address_private: profile.address_private ?? '',
    consignes: profile.consignes ?? '',
    phone: (profile.phone ?? '').replace(/\s+/g, ''),
    quartier: profile.quartier ?? '',
  });
  const [cityConfirmed, setCityConfirmed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function handleCityChange(city: string, lat?: number, lng?: number, country?: string) {
    const confirmed = lat != null && lng != null;
    setForm((f) => ({
      ...f,
      city,
      lat: confirmed ? lat : undefined,
      lng: confirmed ? lng : undefined,
      country: country ?? f.country,
    }));
    setCityConfirmed(confirmed);
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!cityConfirmed && form.city !== profile.city) {
      setError('Veuillez sélectionner votre ville dans la liste déroulante.');
      return;
    }
    setSaving(true);
    setError('');

    const payload: Record<string, unknown> = {
      address_private: form.address_private,
      consignes: form.consignes,
      phone: form.phone,
      quartier: form.quartier,
    };

    if (form.city !== profile.city && cityConfirmed) {
      payload.city = form.city;
      payload.lat = form.lat;
      payload.lng = form.lng;
      payload.country = form.country;
    }

    const res = await fetch('/api/ambassadeur/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Une erreur est survenue.');
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-indigo-500" />
        <h2 className="font-semibold text-slate-800 text-sm">Mes informations</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <CityInput
          value={form.city}
          onChange={handleCityChange}
          label="Ville"
          required
        />

        {!cityConfirmed && form.city !== profile.city && (
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            Sélectionnez une ville dans la liste pour valider les coordonnées.
          </p>
        )}

        <CountrySelect
          value={form.country}
          onChange={(c) => { setForm((f) => ({ ...f, country: c })); setSaved(false); }}
          label="Pays"
        />

        <div>
          <label className="block text-sm text-slate-700 mb-1.5">
            Quartier ou arrondissement
            <span className="ml-1.5 text-xs font-normal text-slate-400">(optionnel)</span>
          </label>
          <input
            type="text"
            value={form.quartier}
            onChange={(e) => { setForm((f) => ({ ...f, quartier: e.target.value })); setSaved(false); }}
            placeholder="ex : Paris 15e, Abidjan Cocody, Lyon Presqu'île"
            className={inputCls}
          />
          <p className="text-xs text-slate-400 mt-1">
            Aide les visiteurs à te retrouver s'ils sont dans le même quartier.
          </p>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1.5">Adresse privée</label>
          <textarea
            value={form.address_private}
            onChange={(e) => { setForm((f) => ({ ...f, address_private: e.target.value })); setSaved(false); }}
            rows={2}
            placeholder="12 rue de la Paix, 75001 Paris"
            className={inputCls}
          />
          <p className="text-xs text-slate-400 mt-1">Partagée uniquement avec les visiteurs que vous acceptez.</p>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1.5">Détails utiles pour vos visiteurs (optionnel)</label>
          <textarea
            value={form.consignes}
            onChange={(e) => { setForm((f) => ({ ...f, consignes: e.target.value })); setSaved(false); }}
            rows={3}
            placeholder="Ex. : code interphone B12. Parking libre rue Pasteur."
            className={inputCls}
          />
        </div>

        <PhoneInput
          label="Téléphone (WhatsApp de préférence)"
          id="phone"
          value={form.phone}
          onChange={(v) => { setForm((f) => ({ ...f, phone: v })); setSaved(false); }}
        />

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {saved && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Informations enregistrées !
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer mes informations
        </button>
      </form>
    </section>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white';
