import Link from 'next/link';
import { AlertCircle, ChevronRight } from 'lucide-react';
import type { HostToCheck } from '@/lib/admin/stats-helpers';
import { CONTEXT_LABEL_FR } from '@/lib/admin/context-label';

type Props = {
  hosts: HostToCheck[];
};

export default function HostsToCheck({ hosts }: Props) {
  if (hosts.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-slate-700">Ambassades à vérifier</h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {hosts.map((h) => (
          <li key={h.hostId}>
            <Link
              href={`/admin/ambassadeurs?id=${h.hostId}`}
              className="flex items-center justify-between gap-3 px-2 py-2.5 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {h.firstName} <span className="font-normal text-slate-400">·</span> {h.city}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{CONTEXT_LABEL_FR[h.label]}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
