import Link from 'next/link';
import { ChevronRight, Inbox } from 'lucide-react';
import type { ActionQueue as ActionQueueData } from '@/lib/admin/stats-helpers';

type Props = {
  queue: ActionQueueData;
};

export default function ActionQueue({ queue }: Props) {
  const total = queue.pendingCandidates + queue.testimonialsPending + queue.feedbackReports;

  if (total === 0) {
    return (
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Inbox className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">À traiter</h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">Rien à traiter en ce moment.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Inbox className="w-4 h-4 text-violet-600" />
        <h2 className="text-sm font-semibold text-slate-700">À traiter</h2>
      </div>
      <ul className="space-y-1">
        {queue.pendingCandidates > 0 && (
          <li>
            <Link
              href="/admin/ambassadeurs?status=pending_review"
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
            >
              <span>
                <span className="font-semibold text-violet-700">{queue.pendingCandidates}</span> candidat{queue.pendingCandidates > 1 ? 's' : ''} en attente
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </li>
        )}
        {queue.testimonialsPending > 0 && (
          <li>
            <Link
              href="/admin/temoignages"
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
            >
              <span>
                <span className="font-semibold text-violet-700">{queue.testimonialsPending}</span> témoignage{queue.testimonialsPending > 1 ? 's' : ''} à modérer
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </li>
        )}
        {queue.feedbackReports > 0 && (
          <li>
            <Link
              href="/admin/feedback"
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
            >
              <span>
                <span className="font-semibold text-violet-700">{queue.feedbackReports}</span> signalement{queue.feedbackReports > 1 ? 's' : ''} à traiter
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
