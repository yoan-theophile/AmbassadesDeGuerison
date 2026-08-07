import { describe, it, expect } from 'vitest';

// Logique extraite de GET /api/host-activations — sélection de l'event de référence
// (bug lié à la même cause racine que lib/homepage-data.ts:liveInProgress, corrigé en
// parallèle dans ce diff). Avant le fix, la requête "live en cours" ne filtrait que sur
// la fenêtre horaire (event_date), pas sur closed_at : après un "Clôturer le live"
// admin, la carte publique pouvait continuer à désigner l'event clôturé comme
// "en cours" et donc appeler les pins de l'event fermé au lieu de basculer sur le
// prochain/dernier event, pendant toute la fenêtre NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS.

interface EventRow {
  id: string;
  event_date: string;
  closed_at: string | null;
}

function selectReferenceEvent(
  events: EventRow[],
  now: Date,
  windowHours = 4,
): EventRow | null {
  const nowISO = now.toISOString();
  const windowStart = new Date(now.getTime() - windowHours * 3_600_000).toISOString();

  const inProgress = events
    .filter((e) => e.event_date <= nowISO && e.event_date >= windowStart && e.closed_at === null)
    .sort((a, b) => (a.event_date < b.event_date ? 1 : -1))[0];
  if (inProgress) return inProgress;

  const next = events
    .filter((e) => e.event_date > nowISO)
    .sort((a, b) => (a.event_date < b.event_date ? -1 : 1))[0];
  if (next) return next;

  const last = events
    .filter((e) => e.event_date <= nowISO)
    .sort((a, b) => (a.event_date < b.event_date ? 1 : -1))[0];
  return last ?? null;
}

const NOW = new Date('2026-08-07T12:00:00Z');

describe('GET /api/host-activations — sélection event de référence respecte closed_at', () => {
  it('un live récent non clôturé dans la fenêtre est retenu comme "en cours"', () => {
    const events: EventRow[] = [
      { id: 'live-1', event_date: '2026-08-07T11:00:00Z', closed_at: null },
    ];
    const ref = selectReferenceEvent(events, NOW);
    expect(ref?.id).toBe('live-1');
  });

  it('régression : un live clôturé par l\'admin dans sa fenêtre horaire n\'est plus sélectionné comme "en cours"', () => {
    const events: EventRow[] = [
      { id: 'closed-live', event_date: '2026-08-07T11:00:00Z', closed_at: '2026-08-07T11:55:00Z' },
      { id: 'next-live', event_date: '2026-08-14T19:00:00Z', closed_at: null },
    ];
    const ref = selectReferenceEvent(events, NOW);
    expect(ref?.id).toBe('next-live');
  });

  it('live clôturé + aucun event futur → bascule sur le dernier event passé (peu importe closed_at)', () => {
    const events: EventRow[] = [
      { id: 'closed-live', event_date: '2026-08-07T11:00:00Z', closed_at: '2026-08-07T11:55:00Z' },
      { id: 'older-live', event_date: '2026-07-01T19:00:00Z', closed_at: '2026-07-01T22:00:00Z' },
    ];
    const ref = selectReferenceEvent(events, NOW);
    // Le closed_at n'exclut l'event QUE de la sélection "en cours" — comme fallback
    // "dernier event passé", il reste éligible (sinon aucun fallback n'existerait
    // après clôture, cassant l'état "carte vide" attendu).
    expect(ref?.id).toBe('closed-live');
  });

  it('aucun event du tout → null', () => {
    expect(selectReferenceEvent([], NOW)).toBeNull();
  });
});
