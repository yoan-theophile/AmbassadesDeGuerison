import type { SupabaseClient } from '@supabase/supabase-js';

export type DevState = 'live' | 'live-zero' | 'soon' | 'upcoming' | 'past' | 'closed' | 'blank';

export async function applyState(supabase: SupabaseClient, state: DevState) {
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, event_date')
    .order('event_date', { ascending: true });

  if (error || !events?.length) {
    throw new Error('Aucun événement en base. Relancez node scripts/seed.js d\'abord.');
  }

  const now = Date.now();
  const WINDOW_H = Number(process.env.NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS ?? 4);

  const pastEvents = events.filter(e => new Date(e.event_date).getTime() <= now);
  const futureEvents = events.filter(e => new Date(e.event_date).getTime() > now);

  // Même logique de sélection que scripts/demo-state.js:140-156
  const liveWindowEvent = events.find(e => {
    const ms = new Date(e.event_date).getTime();
    return ms <= now && now <= ms + WINDOW_H * 3600 * 1000;
  }) ?? null;
  const outsideWindow = pastEvents.filter(
    e => now > new Date(e.event_date).getTime() + WINDOW_H * 3600 * 1000,
  );
  const demoLiveEvent =
    liveWindowEvent ??
    outsideWindow[outsideWindow.length - 1] ??
    pastEvents[pastEvents.length - 1];
  const demoFutureEvent =
    futureEvents[0] ??
    (outsideWindow.length >= 2 ? outsideWindow[outsideWindow.length - 2] : null);

  if (!demoLiveEvent) {
    throw new Error('Aucun événement passé trouvé. Relancez node scripts/seed.js d\'abord.');
  }

  const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
  const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();
  const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

  if (state === 'live') {
    await supabase
      .from('events')
      .update({
        event_date: hoursFromNow(-2),
        registration_opens_at: daysAgo(8),
        registration_closes_at: hoursFromNow(4),
      })
      .eq('id', demoLiveEvent.id);
    await supabase
      .from('host_activations')
      .update({ is_active: true })
      .eq('event_id', demoLiveEvent.id);
    if (demoFutureEvent) {
      await supabase
        .from('events')
        .update({ event_date: daysFromNow(10) })
        .eq('id', demoFutureEvent.id);
    }
    return;
  }

  // Live en cours mais 0 ambassadeurs confirmés (campagne email pas encore envoyée)
  if (state === 'live-zero') {
    await supabase
      .from('events')
      .update({
        event_date: hoursFromNow(-2),
        registration_opens_at: daysAgo(8),
        registration_closes_at: hoursFromNow(4),
      })
      .eq('id', demoLiveEvent.id);
    await supabase
      .from('host_activations')
      .update({ is_active: false })
      .eq('event_id', demoLiveEvent.id);
    if (demoFutureEvent) {
      await supabase
        .from('events')
        .update({ event_date: daysFromNow(10) })
        .eq('id', demoFutureEvent.id);
    }
    return;
  }

  if (state === 'soon') {
    await supabase.from('host_activations').update({ is_active: false }).in('is_active', [true, false]);
    await supabase
      .from('events')
      .update({
        event_date: daysAgo(7),
        registration_opens_at: daysAgo(14),
        registration_closes_at: daysAgo(7),
      })
      .eq('id', demoLiveEvent.id);
    if (demoFutureEvent) {
      await supabase
        .from('events')
        .update({ event_date: daysFromNow(3) })
        .eq('id', demoFutureEvent.id);
    }
    return;
  }

  if (state === 'upcoming') {
    await supabase.from('host_activations').update({ is_active: false }).in('is_active', [true, false]);
    await supabase
      .from('events')
      .update({
        event_date: daysAgo(7),
        registration_opens_at: daysAgo(14),
        registration_closes_at: daysAgo(7),
      })
      .eq('id', demoLiveEvent.id);
    if (demoFutureEvent) {
      await supabase
        .from('events')
        .update({ event_date: daysFromNow(10) })
        .eq('id', demoFutureEvent.id);
    }
    return;
  }

  if (state === 'past') {
    await supabase.from('host_activations').update({ is_active: false }).in('is_active', [true, false]);
    await supabase
      .from('events')
      .update({
        event_date: daysAgo(7),
        registration_opens_at: daysAgo(14),
        registration_closes_at: daysAgo(7),
      })
      .eq('id', demoLiveEvent.id);
    if (demoFutureEvent) {
      await supabase
        .from('events')
        .update({ event_date: daysAgo(10) })
        .eq('id', demoFutureEvent.id);
    }
    return;
  }

  if (state === 'closed') {
    await supabase.from('host_activations').update({ is_active: false }).in('is_active', [true, false]);
    await supabase
      .from('events')
      .update({
        event_date: hoursFromNow(-(WINDOW_H + 1)),
        registration_opens_at: daysAgo(8),
        registration_closes_at: daysAgo(1),
      })
      .eq('id', demoLiveEvent.id);
    if (demoFutureEvent) {
      await supabase
        .from('events')
        .update({ event_date: daysFromNow(10) })
        .eq('id', demoFutureEvent.id);
    }
    return;
  }

  // Futur live annoncé, 0 ambassadeurs confirmés (campagne email pas encore envoyée)
  if (state === 'blank') {
    await supabase.from('host_activations').update({ is_active: false }).in('is_active', [true, false]);
    await supabase
      .from('events')
      .update({
        event_date: daysAgo(7),
        registration_opens_at: daysAgo(14),
        registration_closes_at: daysAgo(7),
      })
      .eq('id', demoLiveEvent.id);
    if (demoFutureEvent) {
      await supabase
        .from('events')
        .update({
          event_date: daysFromNow(10),
          registration_opens_at: daysAgo(1),
          registration_closes_at: daysFromNow(9),
        })
        .eq('id', demoFutureEvent.id);
      await supabase
        .from('host_activations')
        .update({ is_active: false })
        .eq('event_id', demoFutureEvent.id);
    }
  }
}
