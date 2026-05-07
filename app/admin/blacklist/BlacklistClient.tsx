'use client';

import { useState } from 'react';
import { Ban, Trash2, UserX } from 'lucide-react';

type Entry = {
  id: string;
  email: string | null;
  phone: string | null;
  reason: string;
  added_by: string | null;
  created_at: string;
};

interface Props { entries: Entry[] }

export default function BlacklistClient({ entries: initial }: Props) {
  const [entries, setEntries] = useState(initial);
  const [form, setForm] = useState({ email: '', phone: '', reason: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() && !form.phone.trim()) {
      setAddError('E-mail ou téléphone requis');
      return;
    }
    setAdding(true);
    setAddError('');
    const res = await fetch('/api/admin/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const d = await res.json();
      setAddError(d.error ?? 'Erreur');
    }
    setAdding(false);
  }

  async function handleRemove(id: string) {
    setRemoving(id);
    const res = await fetch('/api/admin/blacklist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setEntries((e) => e.filter((x) => x.id !== id));
    setRemoving(null);
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Blocage utilisateurs</h1>
        <p className="text-slate-500 text-sm">{entries.length} entrée{entries.length > 1 ? 's' : ''}</p>
      </div>

      {/* Formulaire ajout — placé en haut : action principale, reste visible
          sans scroller même quand l'historique des blocages s'allonge. */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Ban className="w-4 h-4 text-red-500" />
          <p className="text-sm font-medium text-slate-800">Bloquer un utilisateur</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputCls}
              placeholder="spam@exemple.com"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputCls}
              placeholder="+33 6…"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Motif (interne) *</label>
          <input
            type="text"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
            className={inputCls}
            placeholder="Spam, harcèlement, fausses demandes…"
          />
        </div>
        {addError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{addError}</p>}
        <button
          type="submit"
          disabled={adding}
          className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {adding ? 'Blocage…' : 'Bloquer cet utilisateur'}
        </button>
      </form>

      {/* Liste — historique des blocages, en dessous du formulaire pour
          permettre l'ajout rapide quel que soit le nombre d'entrées. */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {entries.length === 0 ? (
          <p className="px-6 py-8 text-slate-400 text-sm text-center">Aucune entrée</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {entries.map((e) => (
              <li key={e.id} className="flex items-start gap-4 px-5 py-4">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <UserX className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {e.email ?? e.phone ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{e.reason}</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {new Date(e.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(e.id)}
                  disabled={removing === e.id}
                  className="w-8 h-8 flex items-center justify-center text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  title="Retirer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-white';
