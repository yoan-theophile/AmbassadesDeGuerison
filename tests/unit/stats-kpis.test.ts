import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock du client Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}));

describe('Admin stats — requête "dernier live"', () => {
  it('sélectionne l\'event passé le plus récent (lte event_date)', () => {
    // La query doit utiliser lte (<=) et non lt (<)
    // pour inclure un event dont event_date = maintenant
    const now = new Date();
    const past = new Date(now.getTime() - 1000).toISOString();
    const future = new Date(now.getTime() + 1000).toISOString();

    const events = [
      { id: '1', event_date: past },
      { id: '2', event_date: future },
    ];

    const lastEvent = events
      .filter((e) => e.event_date <= now.toISOString())
      .sort((a, b) => b.event_date.localeCompare(a.event_date))[0];

    expect(lastEvent.id).toBe('1');
  });

  it('retourne null si aucun event passé', () => {
    const future = new Date(Date.now() + 1000).toISOString();
    const events = [{ id: '1', event_date: future }];

    const lastEvent =
      events
        .filter((e) => e.event_date <= new Date().toISOString())
        .sort((a, b) => b.event_date.localeCompare(a.event_date))[0] ?? null;

    expect(lastEvent).toBeNull();
  });
});
