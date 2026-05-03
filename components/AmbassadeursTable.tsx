'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Ambassadeur {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  country: string;
  host_type: string;
  status: string;
  contact_mode: string;
  capacity: number | null;
  created_at: string;
  phone: string | null;
  healing_challenge_done: boolean | null;
  conferences_assistees: boolean | null;
  church_attendance: string | null;
  denomination: string | null;
  parcours_spirituel: string | null;
  livres_lus: string | null;
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
  validated:          { label: 'Validé',          className: 'bg-emerald-50 text-emerald-700' },
  pending_review:     { label: 'En examen',       className: 'bg-amber-50 text-amber-700'    },
  pre_approved:       { label: 'Pré-approuvé',    className: 'bg-blue-50 text-blue-700'      },
  enrichment_pending: { label: 'Questionnaire',   className: 'bg-purple-50 text-purple-700'  },
  suspended:          { label: 'Suspendu',        className: 'bg-red-50 text-red-700'        },
  rejected:           { label: 'Refusé',          className: 'bg-slate-100 text-slate-500'   },
};

// pre_approved → validated est bloqué côté API ; seul validated_bypass est permis
const STATUS_ACTIONS: Record<string, { action: string; label: string; className: string }[]> = {
  pending_review:     [{ action: 'pre_approved',    label: 'Pré-approuver',      className: 'bg-blue-50 text-blue-700 hover:bg-blue-100' }, { action: 'rejected', label: 'Refuser', className: 'bg-slate-50 text-slate-600 hover:bg-slate-100' }],
  pre_approved:       [{ action: 'validated_bypass', label: 'Valider (bypass)',   className: 'bg-amber-50 text-amber-700 hover:bg-amber-100' }, { action: 'rejected', label: 'Refuser', className: 'bg-slate-50 text-slate-600 hover:bg-slate-100' }],
  enrichment_pending: [{ action: 'validated',       label: 'Valider',            className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' }, { action: 'rejected', label: 'Refuser', className: 'bg-slate-50 text-slate-600 hover:bg-slate-100' }],
  validated:          [{ action: 'suspended',       label: 'Suspendre',          className: 'bg-red-50 text-red-700 hover:bg-red-100' }],
  suspended:          [{ action: 'reactiver',       label: 'Réactiver',          className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' }],
  rejected:           [{ action: 'reactiver',       label: 'Réintégrer',         className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' }],
};

const HOST_TYPE_LABELS: Record<string, string> = {
  individual: 'Particulier',
  church:     'Église',
};

const CHURCH_ATTENDANCE_LABELS: Record<string, string> = {
  regular:    'Régulièrement',
  occasional: 'Occasionnellement',
  none:       'Pas d\'église',
};

const FILTERS = [
  { value: 'all',              label: 'Tous'          },
  { value: 'pending_review',   label: 'En examen'     },
  { value: 'pre_approved',     label: 'Pré-approuvés' },
  { value: 'enrichment_pending', label: 'Questionnaire' },
  { value: 'validated',        label: 'Validés'       },
  { value: 'suspended',        label: 'Suspendus'     },
  { value: 'rejected',         label: 'Refusés'       },
];

function QuestionnairPanel({ a }: { a: Ambassadeur }) {
  const hasQuestionnaire = a.parcours_spirituel || a.church_attendance || a.denomination || a.livres_lus || a.healing_challenge_done || a.conferences_assistees || a.phone;

  if (!hasQuestionnaire) {
    return (
      <p className="text-xs text-slate-400 italic">Questionnaire non encore rempli.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      {a.phone && (
        <div>
          <p className="text-slate-400 mb-0.5">Téléphone</p>
          <p className="text-slate-700">{a.phone}</p>
        </div>
      )}
      {a.church_attendance && (
        <div>
          <p className="text-slate-400 mb-0.5">Fréquentation église</p>
          <p className="text-slate-700">{CHURCH_ATTENDANCE_LABELS[a.church_attendance] ?? a.church_attendance}</p>
        </div>
      )}
      {a.denomination && (
        <div>
          <p className="text-slate-400 mb-0.5">Dénomination</p>
          <p className="text-slate-700">{a.denomination}</p>
        </div>
      )}
      <div className="flex gap-4">
        <div>
          <p className="text-slate-400 mb-0.5">Défi Guérison</p>
          <p className="text-slate-700">{a.healing_challenge_done ? 'Oui' : 'Non'}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">Conférence DT</p>
          <p className="text-slate-700">{a.conferences_assistees ? 'Oui' : 'Non'}</p>
        </div>
      </div>
      {a.parcours_spirituel && (
        <div className="sm:col-span-2">
          <p className="text-slate-400 mb-0.5">Parcours spirituel</p>
          <p className="text-slate-700 whitespace-pre-wrap">{a.parcours_spirituel}</p>
        </div>
      )}
      {a.livres_lus && (
        <div className="sm:col-span-2">
          <p className="text-slate-400 mb-0.5">Livres / formations</p>
          <p className="text-slate-700 whitespace-pre-wrap">{a.livres_lus}</p>
        </div>
      )}
    </div>
  );
}

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
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [search, setSearch] = useState(searchQ);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  async function handleAction(id: string, action: string) {
    setActionLoading(id);
    const res = await fetch(`/api/admin/ambassadeurs/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      setStatusOverrides((prev) => ({ ...prev, [id]: data.status }));
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

      {initial.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun ambassadeur dans cette catégorie.</p>
      ) : (
        <div className={`bg-white rounded-xl border border-slate-100 overflow-hidden transition-opacity ${isPending ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium w-6"></th>
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
                {initial.map((a) => {
                  const displayStatus = statusOverrides[a.id] ?? a.status;
                  const s = STATUS_LABELS[displayStatus] ?? { label: displayStatus, className: 'bg-slate-50 text-slate-600' };
                  const isLoading = actionLoading === a.id;
                  const isExpanded = expandedId === a.id;
                  return (
                    <React.Fragment key={a.id}>
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : a.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label={isExpanded ? 'Réduire' : 'Voir le profil'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{a.first_name} {a.last_name}</td>
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
                          <div className="flex gap-1.5 flex-wrap">
                            {(STATUS_ACTIONS[displayStatus] ?? []).map((act) => (
                              <button
                                key={act.action}
                                onClick={() => handleAction(a.id, act.action)}
                                disabled={isLoading}
                                className={`text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap ${act.className}`}
                              >
                                {isLoading ? '…' : act.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="px-6 pb-5 pt-3 bg-slate-50/60 border-b border-slate-100">
                            <div className="max-w-2xl">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Questionnaire ambassadeur</p>
                              <QuestionnairPanel a={a} />
                              {displayStatus === 'enrichment_pending' && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                  <button
                                    onClick={() => handleAction(a.id, 'validated')}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
                                  >
                                    {isLoading ? '…' : 'Valider le questionnaire'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
