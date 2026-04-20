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
});
