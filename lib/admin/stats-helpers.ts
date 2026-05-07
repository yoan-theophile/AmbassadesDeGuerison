import { createServiceClient } from '@/lib/supabase/server';
import { computeContextLabel, type ContextLabel } from '@/lib/admin/context-label';

// Helpers data agrégés pour /admin/stats. Tous fail-safe :
// retournent des valeurs par défaut + log warning au lieu de throw.

// ─────────────────────────────────────────────────────────────────────
// getActionQueue — file Camille : N candidats / N témoignages / N aides
// ─────────────────────────────────────────────────────────────────────

export type ActionQueue = {
  pendingCandidates: number;
  testimonialsPending: number;
  feedbackReports: number;
};

export async function getActionQueue(): Promise<ActionQueue> {
  const supabase = createServiceClient();
  try {
    const [candidates, testimonials, reports] = await Promise.all([
      supabase.from('host_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('is_visible', false),
      supabase.from('live_feedbacks').select('id', { count: 'exact', head: true }).eq('reported', true).eq('report_status', 'pending'),
    ]);
    return {
      pendingCandidates: candidates.count ?? 0,
      testimonialsPending: testimonials.count ?? 0,
      feedbackReports: reports.count ?? 0,
    };
  } catch (e) {
    console.warn('[stats-helpers] getActionQueue failed', e);
    return { pendingCandidates: 0, testimonialsPending: 0, feedbackReports: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────
// getRecentFruits — 3 derniers témoignages publiés depuis le dernier live
// ─────────────────────────────────────────────────────────────────────

export type RecentFruit = {
  id: string;
  excerpt: string;
  authorFirstName: string;
  city: string;
  eventTitle: string;
};

const FRUIT_EXCERPT_MAX = 120;

export async function getRecentFruits(lastEventId: string | null): Promise<RecentFruit[]> {
  if (!lastEventId) return [];
  const supabase = createServiceClient();
  try {
    const { data } = await supabase
      .from('testimonials')
      .select('id, content, visitor_name, submitter_city, host_profile_id, event_id, host_profiles(first_name, city), events(title)')
      .eq('is_visible', true)
      .eq('event_id', lastEventId)
      .order('created_at', { ascending: false })
      .limit(3);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => {
      const host = Array.isArray(row.host_profiles) ? row.host_profiles[0] : row.host_profiles;
      const event = Array.isArray(row.events) ? row.events[0] : row.events;
      const authorFirstName = host?.first_name ?? row.visitor_name ?? 'Anonyme';
      const city = host?.city ?? row.submitter_city ?? '';
      const content = String(row.content ?? '');
      const excerpt = content.length > FRUIT_EXCERPT_MAX ? content.slice(0, FRUIT_EXCERPT_MAX - 1).trimEnd() + '…' : content;
      return {
        id: row.id,
        excerpt,
        authorFirstName,
        city,
        eventTitle: event?.title ?? '',
      };
    });
  } catch (e) {
    console.warn('[stats-helpers] getRecentFruits failed', e);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────
// getHostsToCheck — max 5 ambassadeurs avec contexte factuel
// ─────────────────────────────────────────────────────────────────────
//
// 5 queries parallèles (per 7B), assemblage JS via computeContextLabel.
// Premier match wins (per 2A). Ordre par priorité descendant + validated_at ASC.

export type HostToCheck = {
  hostId: string;
  firstName: string;
  city: string;
  label: ContextLabel;
};

const PRIORITY_ORDER: ContextLabel[] = [
  'profile_incomplete',
  'never_activated',
  'inactive_2_lives',
  'city_no_demand',
  'old_no_welcome',
];

export async function getHostsToCheck(lastEventIds: string[]): Promise<HostToCheck[]> {
  const supabase = createServiceClient();
  try {
    // Fallback sur created_at — pas de validated_at en V1 (proxy raisonnable :
    // un host validé a été créé peu avant sa validation, surtout en seed démo).
    const { data: hosts } = await supabase
      .from('host_profiles')
      .select('id, first_name, city, profile_photo_url, created_at')
      .eq('status', 'validated')
      .order('created_at', { ascending: true });

    if (!hosts || hosts.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hostIds = hosts.map((h: any) => h.id);
    const lastEventId = lastEventIds[0] ?? null;
    const last2EventIds = lastEventIds.slice(0, 2);

    const [activationsAll, activationsLast2, contactsAccepted, contactsLastEventByCity] = await Promise.all([
      supabase
        .from('host_activations')
        .select('host_profile_id, is_active')
        .in('host_profile_id', hostIds)
        .eq('is_active', true),
      last2EventIds.length > 0
        ? supabase
            .from('host_activations')
            .select('host_profile_id, event_id, is_active')
            .in('host_profile_id', hostIds)
            .in('event_id', last2EventIds)
            .eq('is_active', true)
        : Promise.resolve({ data: [] as Array<{ host_profile_id: string; event_id: string }> }),
      supabase
        .from('contact_requests')
        .select('host_activation_id, host_activations!inner(host_profile_id)')
        .eq('status', 'accepted'),
      lastEventId
        ? supabase
            .from('contact_requests')
            .select('host_activation_id, host_activations!inner(host_profile_id, event_id)')
            .eq('host_activations.event_id', lastEventId)
        : Promise.resolve({ data: [] as Array<{ host_activations: { host_profile_id: string } }> }),
    ]);

    const everActiveSet = new Set<string>(((activationsAll.data ?? []) as Array<{ host_profile_id: string }>).map((a) => a.host_profile_id));
    const last2ActiveCount = new Map<string, number>();
    for (const a of (activationsLast2.data ?? []) as Array<{ host_profile_id: string }>) {
      last2ActiveCount.set(a.host_profile_id, (last2ActiveCount.get(a.host_profile_id) ?? 0) + 1);
    }
    const everWelcomedSet = new Set<string>(
      ((contactsAccepted.data ?? []) as Array<{ host_activations: { host_profile_id: string } | { host_profile_id: string }[] }>)
        .map((c) => (Array.isArray(c.host_activations) ? c.host_activations[0]?.host_profile_id : c.host_activations?.host_profile_id))
        .filter((id): id is string => Boolean(id))
    );
    const cityDemandSet = new Set<string>();
    for (const c of (contactsLastEventByCity.data ?? []) as Array<{ host_activations: { host_profile_id: string } | { host_profile_id: string }[] }>) {
      const hpid = Array.isArray(c.host_activations) ? c.host_activations[0]?.host_profile_id : c.host_activations?.host_profile_id;
      if (hpid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const host = hosts.find((h: any) => h.id === hpid);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (host) cityDemandSet.add((host as any).city);
      }
    }

    const now = Date.now();
    const candidates: HostToCheck[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const h of hosts as any[]) {
      const createdAt = h.created_at ? new Date(h.created_at).getTime() : now;
      const monthsSinceValidation = (now - createdAt) / (1000 * 60 * 60 * 24 * 30);
      const facts = {
        profilePhotoUrl: h.profile_photo_url,
        hasEverBeenActive: everActiveSet.has(h.id),
        activationsLast2Events: last2ActiveCount.get(h.id) ?? 0,
        cityDemandCountLastEvent: cityDemandSet.has(h.city) ? 1 : 0,
        monthsSinceValidation,
        hasEverWelcomed: everWelcomedSet.has(h.id),
      };
      const label = computeContextLabel(facts);
      if (label) {
        candidates.push({
          hostId: h.id,
          firstName: h.first_name,
          city: h.city,
          label,
        });
      }
    }

    // Tri par priorité (premier match wins déjà appliqué par computeContextLabel),
    // puis par validated_at ASC (déjà imposé par la query). Limit 5.
    candidates.sort((a, b) => PRIORITY_ORDER.indexOf(a.label) - PRIORITY_ORDER.indexOf(b.label));
    return candidates.slice(0, 5);
  } catch (e) {
    console.warn('[stats-helpers] getHostsToCheck failed', e);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────
// getSnapshotTotals — chiffres globaux du footer
// ─────────────────────────────────────────────────────────────────────

export type SnapshotTotals = {
  ambassadors: number;
  countries: number;
  testimonials: number;
  visitorsAccepted: number;
};

export async function getSnapshotTotals(): Promise<SnapshotTotals> {
  const supabase = createServiceClient();
  try {
    const [ambassadors, countriesData, testimonials, visitors] = await Promise.all([
      supabase.from('host_profiles').select('id', { count: 'exact', head: true }).eq('status', 'validated'),
      supabase.from('host_profiles').select('country').eq('status', 'validated'),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('is_visible', true),
      supabase.from('contact_requests').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    ]);

    const countries = new Set(((countriesData.data ?? []) as Array<{ country: string }>).map((r) => r.country)).size;

    return {
      ambassadors: ambassadors.count ?? 0,
      countries,
      testimonials: testimonials.count ?? 0,
      visitorsAccepted: visitors.count ?? 0,
    };
  } catch (e) {
    console.warn('[stats-helpers] getSnapshotTotals failed', e);
    return { ambassadors: 0, countries: 0, testimonials: 0, visitorsAccepted: 0 };
  }
}
