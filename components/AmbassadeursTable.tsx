'use client';

import { useState } from 'react';

type Status = 'active' | 'pending_onboarding' | 'suspended';

interface Ambassadeur {
  id: string;
  first_name: string;
  city: string;
  country: string;
  host_type: string;
  status: string;
  contact_mode: string;
  capacity: number | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active:              { label: 'Actif',      className: 'bg-emerald-50 text-emerald-700' },
  pending_onboarding:  { label: 'En attente', className: 'bg-amber-50 text-amber-700'    },
  suspended:           { label: 'Suspendu',   className: 'bg-red-50 text-red-700'        },
};

const HOST_TYPE_LABELS: Record<string, string> = {
  individual: 'Particulier',
  church:     'Église',
};

const FILTERS: { value: string; label: string }[] = [
  { value: 'all',             label: 'Tous'       },
  { value: 'active',          label: 'Actifs'     },
  { value: 'pending_onboarding', label: 'En attente' },
  { value: 'suspended',       label: 'Suspendus'  },
];

export default function AmbassadeursTable({ ambassadeurs }: { ambassadeurs: Ambassadeur[] }) {
  const [filter, setFilter] = useState('all');

  const visible = filter === 'all'
    ? ambassadeurs
    : ambassadeurs.filter((a) => a.status === filter);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-60">
              {f.value === 'all'
                ? ambassadeurs.length
                : ambassadeurs.filter((a) => a.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun ambassadeur dans cette catégorie.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Ville / Pays</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Cap.</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map((a) => {
                const s = STATUS_LABELS[a.status] ?? { label: a.status, className: 'bg-slate-50 text-slate-600' };
                return (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.first_name}</td>
                    <td className="px-4 py-3 text-slate-500">{a.city}, {a.country}</td>
                    <td className="px-4 py-3 text-slate-500">{HOST_TYPE_LABELS[a.host_type] ?? a.host_type}</td>
                    <td className="px-4 py-3 text-slate-500">{a.capacity ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
