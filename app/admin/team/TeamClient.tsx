'use client';

import { useState } from 'react';
import { Trash2, UserPlus, Shield, Crown } from 'lucide-react';

interface Member {
  user_id: string;
  role: string;
  email: string;
  added_at: string;
}

interface Props {
  members: Member[];
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
};

const ROLE_ICONS: Record<string, typeof Crown> = {
  super_admin: Crown,
  admin: Shield,
};

export default function TeamClient({ members: initial }: Props) {
  const [members, setMembers] = useState(initial);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, role: newRole }),
    });
    if (res.ok) {
      setNewEmail('');
      window.location.reload();
    } else {
      const d = await res.json();
      setAddError(d.error ?? 'Erreur');
    }
    setAdding(false);
  }

  async function handleRemove(userId: string) {
    setRemoving(userId);
    const res = await fetch('/api/admin/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (res.ok) {
      setMembers((m) => m.filter((x) => x.user_id !== userId));
    }
    setRemoving(null);
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Équipe admin</h1>
        <p className="text-slate-500 text-sm">Gérez les accès à l'espace d'administration.</p>
      </div>

      {/* Liste des membres */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <p className="px-6 py-8 text-slate-400 text-sm text-center">Aucun membre</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {members.map((m) => {
              const Icon = ROLE_ICONS[m.role] ?? Shield;
              return (
                <li key={m.user_id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.email}</p>
                    <p className="text-xs text-slate-400">{ROLE_LABELS[m.role] ?? m.role}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(m.user_id)}
                    disabled={removing === m.user_id}
                    className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Retirer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Formulaire ajout */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="w-4 h-4 text-indigo-500" />
          <p className="text-sm font-medium text-slate-800">Ajouter un membre</p>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">E-mail (doit déjà avoir un compte)</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="admin@exemple.com"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Rôle</label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'super_admin')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>
        {addError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{addError}</p>}
        <button
          type="submit"
          disabled={adding}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {adding ? 'Ajout…' : 'Ajouter'}
        </button>
      </form>
    </div>
  );
}
