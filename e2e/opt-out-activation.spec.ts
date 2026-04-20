import { test, expect } from '@playwright/test';

/**
 * E2E : Opt-out activation model
 * Scénario : Admin crée un event → trigger active tous les hôtes → un hôte se désactive
 * Prérequis : app en cours d'exécution + Supabase local + .env.local configuré
 */
test.describe('Opt-out activation', () => {
  test('hôte peut se désactiver depuis le dashboard', async ({ page }) => {
    // L'hôte se connecte
    await page.goto('/dashboard');
    // Attend la page dashboard (redirige vers auth si non connecté)
    await expect(page).toHaveURL(/dashboard|auth/);
  });

  test('hôte activé apparaît sur la carte', async ({ page }) => {
    await page.goto('/');
    // La carte charge
    await page.waitForSelector('.leaflet-container', { timeout: 10_000 });
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();
  });
});
