import { describe, it, expect } from 'vitest';

// Logique extraite de lib/homepage-data.ts:getHomepageData() — calcul de liveInProgress.
//
// Bug corrigé : la clôture d'un live (POST /api/admin/live/close) désactive
// host_activations.is_active et renseigne events.closed_at, mais getHomepageData()
// calculait liveInProgress uniquement à partir de event_date (fenêtre horaire),
// sans jamais regarder closed_at. Résultat : le bandeau homepage "Live en cours —
// rejoignez-nous" et le panneau carte "Live en cours / Regarder le live →"
// restaient affichés jusqu'à la fin de la fenêtre NEXT_PUBLIC_LIVE_SIGNAL_WINDOW_HOURS
// (4h par défaut), alors que côté admin (lib/admin/event-window.ts:getCurrentEvent())
// le closed_at était déjà correctement pris en compte depuis le fix précédent
// (commit dfe0e90). Fix : liveInProgress vérifie désormais closed_at === null.

interface LastEvent {
  event_date: string;
  closed_at: string | null;
}

function computeLiveInProgress(lastEvent: LastEvent | null, now: Date, windowHours = 4): boolean {
  const windowStart = new Date(now.getTime() - windowHours * 3600 * 1000).toISOString();
  return !!lastEvent && !lastEvent.closed_at && lastEvent.event_date >= windowStart;
}

const NOW = new Date('2026-08-06T12:00:00Z');

describe('getHomepageData — calcul de liveInProgress', () => {
  it('un live récent non clôturé est "en cours"', () => {
    const lastEvent = { event_date: '2026-08-06T11:00:00Z', closed_at: null };
    expect(computeLiveInProgress(lastEvent, NOW)).toBe(true);
  });

  it('régression : un live clôturé par l\'admin dans sa fenêtre horaire n\'est plus "en cours"', () => {
    const lastEvent = { event_date: '2026-08-06T11:00:00Z', closed_at: '2026-08-06T11:55:00Z' };
    expect(computeLiveInProgress(lastEvent, NOW)).toBe(false);
  });

  it('un live hors fenêtre horaire n\'est pas "en cours" même non clôturé', () => {
    const lastEvent = { event_date: '2026-08-06T06:00:00Z', closed_at: null };
    expect(computeLiveInProgress(lastEvent, NOW)).toBe(false);
  });

  it('aucun dernier event → pas de live en cours', () => {
    expect(computeLiveInProgress(null, NOW)).toBe(false);
  });
});
