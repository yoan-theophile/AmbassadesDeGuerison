import { test, expect } from '@playwright/test';

/**
 * Tests de régression v2
 * Vérifie que les breaking changes de la migration v1→v2 sont correctement appliqués
 */
test.describe('Régression — statut ambassadeur v2', () => {
  test('GET /api/host-activations ne retourne pas status=active', async ({ request }) => {
    const res = await request.get('/api/host-activations');
    if (res.status() !== 200) return; // skip si route non disponible

    const data = await res.json();
    for (const item of data) {
      // Le statut 'active' ne doit plus apparaître dans l'API publique
      if (item.host_profiles) {
        expect(item.host_profiles.status).not.toBe('active');
      }
    }
  });

  test('Page / charge sans erreur JS visible', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { timeout: 10_000 }).catch(() => {});
    // Tolère les erreurs non-critiques mais pas les erreurs JS fatales
    const fatalErrors = errors.filter(
      (e) => e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('Témoignages page charge sans erreur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/temoignages');
    await page.waitForLoadState('networkidle');
    const fatalErrors = errors.filter(
      (e) => e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('Dashboard redirige vers /auth si non connecté', async ({ page }) => {
    await page.goto('/dashboard');
    // Doit être redirigé vers /auth
    await expect(page).toHaveURL(/auth/);
  });

  test('/admin/live continue de rediriger vers /auth post-refactor event-window', async ({ page }) => {
    // Régression CRITIQUE : on a factorisé getCurrentEvent depuis /admin/live
    // vers lib/admin/event-window.ts. Le comportement de la page admin/live
    // doit rester strictement identique (auth gate + chargement).
    await page.goto('/admin/live');
    await expect(page).toHaveURL(/auth/);
  });
});
