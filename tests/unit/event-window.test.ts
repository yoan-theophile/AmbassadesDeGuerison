import { describe, it, expect } from 'vitest';

// Logique de sélection extraite de lib/admin/event-window.ts:getCurrentEvent()
//
// Bug corrigé : "Clôturer le live" désactivait bien host_activations.is_active
// mais events n'avait aucun état "clôturé" persisté. getCurrentEvent() continuait
// donc à sélectionner le même event tant qu'il restait dans sa fenêtre horaire
// [now-pastHours, now+futureHours] — le bouton "Clôturer le live" et tout
// /admin/live redevenaient identiques à avant le clic dès qu'on rechargeait la
// page. Fix : colonne events.closed_at, exclue explicitement de la sélection
// "en cours" — un event clôturé retombe immédiatement sur le fallback "dernier
// event passé", même s'il est encore dans sa fenêtre horaire normale.

interface Event {
  id: string;
  title: string;
  event_date: string;
  closed_at: string | null;
}

function selectCurrentEvent(
  events: Event[],
  now: Date,
  pastHours = 6,
  futureHours = 4
): { event: Event | null; isCurrentLive: boolean } {
  const windowStart = new Date(now.getTime() - pastHours * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + futureHours * 60 * 60 * 1000);

  const current = events
    .filter((e) => e.closed_at === null)
    .filter((e) => {
      const d = new Date(e.event_date);
      return d >= windowStart && d <= windowEnd;
    })
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];

  if (current) return { event: current, isCurrentLive: true };

  const last = events
    .filter((e) => new Date(e.event_date) <= now)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];

  if (last) return { event: last, isCurrentLive: false };

  const next = events
    .filter((e) => new Date(e.event_date) > now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0];

  return { event: next ?? null, isCurrentLive: false };
}

const NOW = new Date('2026-08-06T12:00:00Z');

describe('getCurrentEvent — sélection de l\'event admin', () => {
  it('sélectionne un event dans la fenêtre horaire, non clôturé, comme live en cours', () => {
    const events: Event[] = [
      { id: '1', title: 'Live du jour', event_date: '2026-08-06T11:00:00Z', closed_at: null },
    ];
    const result = selectCurrentEvent(events, NOW);
    expect(result.isCurrentLive).toBe(true);
    expect(result.event?.id).toBe('1');
  });

  it('régression : un event clôturé dans sa fenêtre horaire est exclu du "en cours"', () => {
    const events: Event[] = [
      { id: '1', title: 'Live du jour (clôturé par admin)', event_date: '2026-08-06T11:00:00Z', closed_at: '2026-08-06T11:55:00Z' },
    ];
    const result = selectCurrentEvent(events, NOW);
    expect(result.isCurrentLive).toBe(false);
    // Retombe sur le fallback "dernier event passé" — ici le même event,
    // mais désormais traité comme historique, pas comme live actif.
    expect(result.event?.id).toBe('1');
  });

  it('un event non clôturé dans la fenêtre est préféré au live déjà clôturé', () => {
    const events: Event[] = [
      { id: '1', title: 'Live clôturé (plus récent)', event_date: '2026-08-06T10:00:00Z', closed_at: '2026-08-06T11:00:00Z' },
      { id: '2', title: 'Autre live du jour, encore actif', event_date: '2026-08-06T09:00:00Z', closed_at: null },
    ];
    const result = selectCurrentEvent(events, NOW);
    expect(result.isCurrentLive).toBe(true);
    expect(result.event?.id).toBe('2');
  });

  it('sans aucun event dans la fenêtre, retombe sur le dernier event passé', () => {
    const events: Event[] = [
      { id: '1', title: 'Live ancien', event_date: '2026-07-01T10:00:00Z', closed_at: null },
    ];
    const result = selectCurrentEvent(events, NOW);
    expect(result.isCurrentLive).toBe(false);
    expect(result.event?.id).toBe('1');
  });

  it('sans event passé ni en fenêtre, retombe sur le prochain event futur', () => {
    const events: Event[] = [
      { id: '1', title: 'Live futur', event_date: '2026-09-01T10:00:00Z', closed_at: null },
    ];
    const result = selectCurrentEvent(events, NOW);
    expect(result.isCurrentLive).toBe(false);
    expect(result.event?.id).toBe('1');
  });

  it('aucun event du tout retourne event=null', () => {
    const result = selectCurrentEvent([], NOW);
    expect(result.event).toBeNull();
    expect(result.isCurrentLive).toBe(false);
  });
});
