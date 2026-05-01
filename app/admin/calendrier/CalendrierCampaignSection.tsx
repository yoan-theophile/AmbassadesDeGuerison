'use client';

import { useState } from 'react';
import { Send, Mail, Users, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

type Event = { id: string; title: string; event_date: string };
type Campaign = {
  id: string;
  type: string;
  event_id: string;
  status: string;
  scheduled_at: string;
  sent_count: number | null;
  custom_message: string | null;
};

interface Props {
  futureEvents: Event[];
  campaigns: Campaign[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700',
  sending:  'bg-indigo-50 text-indigo-700',
  sent:     'bg-emerald-50 text-emerald-700',
  failed:   'bg-red-50 text-red-700',
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  pending:  Clock,
  sending:  Clock,
  sent:     CheckCircle2,
  failed:   AlertCircle,
};

const TYPE_LABELS: Record<string, string> = {
  ambassadeurs: 'Ambassadeurs',
  visiteurs:    'Visiteurs',
};

export default function CalendrierCampaignSection({ futureEvents, campaigns }: Props) {
  const [form, setForm] = useState({
    event_id: futureEvents[0]?.id ?? '',
    type: 'ambassadeurs',
    scheduled_at: '',
    custom_message: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess('Campagne planifiée.');
      setForm((f) => ({ ...f, scheduled_at: '', custom_message: '' }));
      setTimeout(() => setSuccess(''), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Erreur');
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Liste des campagnes existantes */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-50">
            {campaigns.map((c) => {
              const StatusIcon = STATUS_ICONS[c.status] ?? Clock;
              const event = futureEvents.find((e) => e.id === c.event_id);
              return (
                <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                    {c.type === 'ambassadeurs' ? (
                      <Users className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <Mail className="w-4 h-4 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {TYPE_LABELS[c.type] ?? c.type}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {event?.title ?? c.event_id} — {new Date(c.scheduled_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${STATUS_COLORS[c.status] ?? 'bg-slate-50 text-slate-500'}`}>
                    <StatusIcon className="w-3 h-3" />
                    {c.status}
                    {c.sent_count != null && ` (${c.sent_count})`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Formulaire planification */}
      {futureEvents.length > 0 && (
        <form onSubmit={handleSchedule} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-medium text-slate-800">Programmer une campagne</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Live</label>
              <select
                value={form.event_id}
                onChange={(e) => setForm((f) => ({ ...f, event_id: e.target.value }))}
                required
                className={selectCls}
              >
                {futureEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} — {new Date(e.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={selectCls}
              >
                <option value="ambassadeurs">Ambassadeurs</option>
                <option value="visiteurs">Visiteurs</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Date d'envoi</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              required
              className={inputCls}
            />
          </div>

          {form.type === 'ambassadeurs' && (
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Message personnalisé (optionnel)</label>
              <textarea
                value={form.custom_message}
                onChange={(e) => setForm((f) => ({ ...f, custom_message: e.target.value }))}
                rows={3}
                className={inputCls}
                placeholder="Bonjour à toutes et tous, le prochain live aura lieu…"
              />
              <p className="text-xs text-slate-300 mt-1">Aparaîtra dans l'e-mail ambassadeur avant le CTA.</p>
            </div>
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-emerald-700 text-sm bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Planification…' : 'Planifier la campagne'}
          </button>
        </form>
      )}

      {futureEvents.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-6">
          Aucun live futur — créez d'abord un événement.
        </p>
      )}
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-white';
const selectCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-white';
