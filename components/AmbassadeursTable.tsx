'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Ambassadeur {
  id: string;
  first_name: string;
  email: string;
  city: string;
  country: string;
  host_type: string;
  status: string;
  contact_mode: string;
  capacity: number | null;
  created_at: string;
}

interface Props {
  ambassadeurs: Ambassadeur[];
  total: number;
  page: number;
  pageSize: number;
  searchQ: string;
  filterStatus: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active:              { label: 'Actif',         className: 'bg-emerald-50 text-emerald-700' },
  pending_onboarding:  { label: 'En attente',    className: 'bg-amber-50 text-amber-700'    },
  onboarding_complete: { label: 'Formation OK',  className: 'bg-blue-50 text-blue-700'      },
  pending_charter:     { label: 'Charte',        className: 'bg-purple-50 text-purple-700'  },
  suspended:           { label: 'Suspendu',      className: 'bg-red-50 text-red-700'        },
};

const HOST_TYPE_LABELS: Record<string, string> = {
  individual: 'Particulier',
  church:     'Église',
};

const FILTERS = [
  { value: 'all',                label: 'Tous'         },
  { value: 'active',             label: 'Actifs'       },
  { value: 'pending_onboarding', label: 'En attente'   },
  { value: 'suspended',          label: 'Suspendus'    },
];

export default function AmbassadeursTable({
  ambassadeurs: initial,
  total,
  page,
  pageSize,
  searchQ,
  filterStatus,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [ambassadeurs, setAmbassadeurs] = useState(initial);
  const [search, setSearch] = useState(searchQ);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  function navigate(updates: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v || v === 'all') sp.delete(k);
      else sp.set(k, v);
    }
    startTransition(() => {
      router.push(`/admin/ambassadeurs?${sp.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q: search, page: '1' });
  }

  async function handleAction(id: string, newStatus: 'suspended' | 'active') {
    setActionLoading(id);
    const res = await fetch(`/api/admin/ambassadeurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setAmbassadeurs((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="search"
          placeholder="Rechercher par nom, e-mail, ville…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
        >
          Rechercher
        </button>
      </form>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => navigate({ status: f.value, page: '1' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === f.value
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {total} ambassadeur{total !== 1 ? 's' : ''}
        </span>
      </div>

      {ambassadeurs.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun ambassadeur dans cette catégorie.</p>
      ) : (
        <div className={`bg-white rounded-xl border border-slate-100 overflow-hidden transition-opacity ${isPending ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium">Ville / Pays</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Cap.</th>
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 font-medium">Inscription</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ambassadeurs.map((a) => {
                  const s = STATUS_LABELS[a.status] ?? { label: a.status, className: 'bg-slate-50 text-slate-600' };
                  const isLoading = actionLoading === a.id;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{a.first_name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{a.email}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{a.city}, {a.country}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{HOST_TYPE_LABELS[a.host_type] ?? a.host_type}</td>
                      <td className="px-4 py-3 text-slate-500">{a.capacity ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(a.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        {a.status === 'active' && (
                          <button
                            onClick={() => handleAction(a.id, 'suspended')}
                            disabled={isLoading}
                            className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {isLoading ? '…' : 'Suspendre'}
                          </button>
                        )}
                        {a.status === 'suspended' && (
                          <button
                            onClick={() => handleAction(a.id, 'active')}
                            disabled={isLoading}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {isLoading ? '…' : 'Réactiver'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate({ page: String(page - 1) })}
            disabled={page <= 1 || isPending}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Précédent
          </button>
          <span className="text-xs text-slate-500">Page {page} / {totalPages}</span>
          <button
            onClick={() => navigate({ page: String(page + 1) })}
            disabled={page >= totalPages || isPending}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
