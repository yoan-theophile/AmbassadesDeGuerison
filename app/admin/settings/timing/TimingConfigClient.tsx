'use client';

import { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import type { TimingConfig } from '@/lib/timing-config';

const FIELDS: { key: keyof TimingConfig; label: string; tooltip: string }[] = [
  {
    key: 'campaign_ambassadors_days_before',
    label: 'Campagne ambassadeurs (J avant)',
    tooltip: 'Nombre de jours avant le live pour envoyer le mail d\'invitation aux ambassadeurs.',
  },
  {
    key: 'campaign_visitors_days_before',
    label: 'Campagne visiteurs (J avant)',
    tooltip: 'Nombre de jours avant le live pour notifier les visiteurs opt-in.',
  },
  {
    key: 'host_reminder_days_before',
    label: 'Rappel ambassadeur (J avant)',
    tooltip: 'Rappel envoyé X jours avant le live pour les ambassadeurs qui n\'ont pas encore confirmé leur capacité.',
  },
  {
    key: 'visitor_auto_decline_days_before',
    label: 'Refus automatique (J avant)',
    tooltip: 'Les demandes en attente sans réponse sont annulées X jours avant le live.',
  },
  {
    key: 'feedback_days_after',
    label: 'Envoi feedback (J après)',
    tooltip: 'Nombre de jours après le live pour envoyer les mails de feedback.',
  },
  {
    key: 'queue_aging_days',
    label: 'Archivage demandes (jours)',
    tooltip: 'Nombre de jours avant qu\'une demande sans réponse soit considérée comme périmée.',
  },
  {
    key: 'soon_threshold_days',
    label: 'Seuil "bientôt" (jours)',
    tooltip: 'Quand le prochain live est dans ≤ N jours, l\'overlay affiche "Les ambassades confirment leur participation" au lieu de la date seule.',
  },
];

interface Props { config: TimingConfig }

export default function TimingConfigClient({ config }: Props) {
  const [values, setValues] = useState(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function set(key: keyof TimingConfig, v: string) {
    const n = parseInt(v);
    if (!isNaN(n) && n >= 0) setValues((prev) => ({ ...prev, [key]: n }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/settings/timing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Erreur');
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Configuration timing</h1>
        <p className="text-slate-500 text-sm">Délais en jours pour les envois automatiques.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        {FIELDS.map(({ key, label, tooltip }) => (
          <div key={key} className="grid sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2">
              <label htmlFor={key} className="block text-sm font-medium text-slate-700">{label}</label>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{tooltip}</p>
            </div>
            <input
              id={key}
              type="number"
              min={0}
              max={60}
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition tabular-nums"
            />
          </div>
        ))}

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Sauvegardé
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
