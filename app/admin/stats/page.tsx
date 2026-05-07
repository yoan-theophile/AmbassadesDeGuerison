import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import AdminLayout from '@/components/AdminLayout';
import { getCurrentEventWindow } from '@/lib/admin/event-window';
import {
  getActionQueue,
  getRecentFruits,
  getHostsToCheck,
  getSnapshotTotals,
} from '@/lib/admin/stats-helpers';
import { logPageView } from '@/lib/admin/page-view-log';
import ActionQueue from './components/ActionQueue';
import RecentFruits from './components/RecentFruits';
import HostsToCheck from './components/HostsToCheck';
import SnapshotFooter from './components/SnapshotFooter';

export const dynamic = 'force-dynamic';

// ┌──────────────────────────────────────────────────────────────────┐
// │  /admin/stats — "À noter depuis le dernier live"                  │
// │                                                                   │
// │  Pivot Codex : panneau factuel sobre, pas de narrative pastoral.  │
// │  4 sections : À traiter / Témoignages récents / Ambassades à     │
// │  vérifier / Snapshot footer.                                      │
// │                                                                   │
// │  Tracking : log page_view stdout (Vercel logs queryable).         │
// │  Auth : middleware proxy.ts gate déjà /admin/* sur role=admin.   │
// │                                                                   │
// │  Flow :                                                           │
// │    1. logPageView (best-effort)                                  │
// │    2. eventWindow séquencé (5A — autres helpers en dépendent)    │
// │    3. Promise.all des 4 helpers stats                            │
// │    4. render 4 sections                                          │
// └──────────────────────────────────────────────────────────────────┘

async function getAdminUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export default async function AdminStatsPage() {
  const adminId = await getAdminUserId();
  logPageView(adminId ?? 'unknown', '/admin/stats');

  const eventWindow = await getCurrentEventWindow();

  const [queue, fruits, hostsToCheck, totals] = await Promise.all([
    getActionQueue(),
    getRecentFruits(eventWindow.lastEvent?.id ?? null),
    getHostsToCheck(eventWindow.lastEventIds),
    getSnapshotTotals(),
  ]);

  const headerLabel = headerLabelFromWindow(eventWindow);

  return (
    <AdminLayout>
      <div className="px-6 py-8 max-w-3xl">
        <h1 className="text-base font-semibold text-slate-800 mb-1">À noter depuis le dernier live</h1>
        <p className="text-sm text-slate-500 mb-6">{headerLabel}</p>

        <div className="space-y-4">
          <ActionQueue queue={queue} />
          <RecentFruits fruits={fruits} />
          <HostsToCheck hosts={hostsToCheck} />
          <SnapshotFooter totals={totals} />
        </div>
      </div>
    </AdminLayout>
  );
}

function headerLabelFromWindow(w: Awaited<ReturnType<typeof getCurrentEventWindow>>): string {
  const { current, lastEvent } = w;

  if (current.isCurrentLive && current.event) {
    return `Live en cours — ${formatDate(current.event.event_date)}`;
  }
  if (lastEvent) {
    return `Live du ${formatDate(lastEvent.event_date)}`;
  }
  if (current.event && !current.isCurrentLive) {
    // current.event est un futur event (fallback 3 dans getCurrentEvent)
    return `Aucun live passé. Prochain live le ${formatDate(current.event.event_date)}.`;
  }
  return 'Aucun live encore programmé. Crée le premier dans le calendrier.';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
