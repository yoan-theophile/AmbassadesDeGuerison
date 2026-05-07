import { createServiceClient } from '@/lib/supabase/server';

// ┌──────────────────────────────────────────────────────────────────┐
// │  getCurrentEvent — logique 3-niveaux de sélection d'event admin  │
// │                                                                   │
// │  1. event dans la fenêtre live [now - PAST_H, now + FUTURE_H]    │
// │     → isCurrentLive = true                                        │
// │  2. fallback : dernier event passé                                │
// │     → isCurrentLive = false                                       │
// │  3. dernier recours : prochain event futur                        │
// │     → isCurrentLive = false                                       │
// │  4. aucun event → { event: null, isCurrentLive: false }           │
// │                                                                   │
// │  Utilisé par /admin/live ET /admin/stats. Source unique de        │
// │  vérité pour "quel event afficher en admin".                      │
// └──────────────────────────────────────────────────────────────────┘

export type AdminEvent = {
  id: string;
  title: string;
  event_date: string;
};

export type CurrentEventResult = {
  event: AdminEvent | null;
  isCurrentLive: boolean;
};

export async function getCurrentEvent(): Promise<CurrentEventResult> {
  const supabase = createServiceClient();
  const now = new Date();
  const pastHours = Number(process.env.LIVE_WINDOW_PAST_HOURS ?? 6);
  const futureHours = Number(process.env.LIVE_WINDOW_FUTURE_HOURS ?? 4);
  const windowStart = new Date(now.getTime() - pastHours * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + futureHours * 60 * 60 * 1000).toISOString();

  const { data: current } = await supabase
    .from('events')
    .select('id, title, event_date')
    .gte('event_date', windowStart)
    .lte('event_date', windowEnd)
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (current) return { event: current, isCurrentLive: true };

  const { data: last } = await supabase
    .from('events')
    .select('id, title, event_date')
    .lte('event_date', now.toISOString())
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (last) return { event: last, isCurrentLive: false };

  const { data: next } = await supabase
    .from('events')
    .select('id, title, event_date')
    .gt('event_date', now.toISOString())
    .order('event_date', { ascending: true })
    .limit(1)
    .single();

  return { event: next ?? null, isCurrentLive: false };
}

// EventWindow — vue étendue pour /admin/stats : inclut last + 3 derniers events
// (utilisé par getHostsToCheck pour calculer "inactif sur 2 derniers lives", etc.)

export type EventWindow = {
  current: CurrentEventResult;
  lastEvent: AdminEvent | null;
  lastEventIds: string[];
};

export async function getCurrentEventWindow(): Promise<EventWindow> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const [currentResult, lastEventsResult] = await Promise.all([
    getCurrentEvent(),
    supabase
      .from('events')
      .select('id, title, event_date')
      .lte('event_date', now)
      .order('event_date', { ascending: false })
      .limit(3),
  ]);

  const lastEvents = (lastEventsResult.data ?? []) as AdminEvent[];
  const lastEvent = lastEvents[0] ?? null;
  const lastEventIds = lastEvents.map((e) => e.id);

  return {
    current: currentResult,
    lastEvent,
    lastEventIds,
  };
}
