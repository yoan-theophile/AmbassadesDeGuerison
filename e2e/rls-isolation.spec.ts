import { test, expect } from '@playwright/test';

/**
 * E2E : RLS isolation
 * Un visiteur anon voit host_profiles_public mais pas les données sensibles
 * L'API /api/host-activations ne retourne pas address_private
 */
test.describe('RLS isolation', () => {
  test('api/host-activations ne retourne pas address_private', async ({ request }) => {
    const res = await request.get('/api/host-activations');
    expect(res.status()).toBe(200);
    const data = await res.json();
    // Aucun des objets ne doit contenir address_private
    for (const item of data) {
      expect(item).not.toHaveProperty('address_private');
    }
  });

  test('api/host-activations ne retourne pas consignes', async ({ request }) => {
    const res = await request.get('/api/host-activations');
    const data = await res.json();
    for (const item of data) {
      expect(item).not.toHaveProperty('consignes');
    }
  });

  // Phase 2 (/plan-eng-review 2026-07-27) : lat_precise/lng_precise sont
  // privées — jamais exposées, même après l'ajout de la géolocalisation
  // visiteur. Étend la même logique de non-fuite que ci-dessus.
  test('api/host-activations ne retourne pas lat_precise ni lng_precise', async ({ request }) => {
    const res = await request.get('/api/host-activations');
    const data = await res.json();
    for (const item of data) {
      expect(item).not.toHaveProperty('lat_precise');
      expect(item).not.toHaveProperty('lng_precise');
    }
  });

  test('api/distance ne renvoie jamais de coordonnées, seulement une distance par id', async ({ request }) => {
    const activationsRes = await request.get('/api/host-activations');
    const activations = await activationsRes.json();
    const hostIds: string[] = activations.slice(0, 3).map((a: { id: string }) => a.id);
    if (hostIds.length === 0) test.skip();

    const res = await request.post('/api/distance', {
      data: { lat: 48.8566, lng: 2.3522, host_ids: hostIds },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();

    for (const id of hostIds) {
      expect(data).toHaveProperty(id);
      const value = data[id];
      expect(value === null || typeof value === 'number').toBe(true);
    }
    // Aucune clé autre que les host_ids demandés (pas de lat/lng qui fuiteraient)
    const serialized = JSON.stringify(data);
    expect(serialized).not.toMatch(/lat_precise|lng_precise|"lat"|"lng"/);
  });

  test('api/distance rejette plus de 20 host_ids', async ({ request }) => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`);
    const res = await request.post('/api/distance', {
      data: { lat: 48.8566, lng: 2.3522, host_ids: tooMany },
    });
    expect(res.status()).toBe(400);
  });

  test('api/distance rejette une latitude invalide', async ({ request }) => {
    const res = await request.post('/api/distance', {
      data: { lat: 200, lng: 2.3522, host_ids: ['00000000-0000-0000-0000-000000000000'] },
    });
    expect(res.status()).toBe(400);
  });
});
