import { test, expect } from '@playwright/test';

/**
 * E2E : /admin/stats — Briefing factuel "À noter depuis le dernier live"
 *
 * Note : ces tests vérifient le comportement non-authentifié (redirect)
 * et la structure de page côté serveur (smoke test). Les tests authentifiés
 * (admin → 4 sections rendues) nécessitent un flow magic link qu'on couvre
 * via le scénario manuel pour l'instant.
 */
test.describe('Admin stats — Briefing factuel', () => {
  test('redirige un visiteur non-auth vers /auth', async ({ page }) => {
    await page.goto('/admin/stats');
    await expect(page).toHaveURL(/auth/);
  });

  test('charge sans erreur JS fatale (smoke côté SSR rendering)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/admin/stats');
    // Redirige vers /auth — pas de chargement complet de la page admin
    // mais on vérifie qu'aucune erreur SSR n'a fui
    await page.waitForLoadState('networkidle');
    const fatalErrors = errors.filter(
      (e) => e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(fatalErrors).toHaveLength(0);
  });
});
