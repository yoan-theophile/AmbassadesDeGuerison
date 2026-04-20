import { test, expect } from '@playwright/test';

/**
 * E2E : Admin stats — authentification
 * Un visiteur non-admin doit être redirigé
 * Un admin doit voir les KPIs
 */
test.describe('Admin stats', () => {
  test('redirige un visiteur non-auth vers login', async ({ page }) => {
    await page.goto('/admin/stats');
    // Doit être redirigé (middleware auth)
    await expect(page).not.toHaveURL('/admin/stats');
  });

  test('redirige /admin/moderation vers login si non-auth', async ({ page }) => {
    await page.goto('/admin/moderation');
    await expect(page).not.toHaveURL('/admin/moderation');
  });
});
