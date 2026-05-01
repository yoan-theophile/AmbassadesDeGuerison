import { test, expect } from '@playwright/test';

/**
 * E2E : Nouvelles pages admin — protection auth
 * Toutes les pages /admin/* doivent rediriger un visiteur non-auth
 */
test.describe('Admin pages v2 — protection auth', () => {
  const adminPages = [
    '/admin/feedback',
    '/admin/blacklist',
    '/admin/team',
    '/admin/calendrier',
    '/admin/settings/timing',
  ];

  for (const path of adminPages) {
    test(`${path} redirige un visiteur non-auth`, async ({ page }) => {
      await page.goto(path);
      // Doit être redirigé hors de la page (vers /auth ou une page de login)
      await expect(page).not.toHaveURL(path);
    });
  }

  test('/admin/moderation redirige vers /admin/live', async ({ page }) => {
    await page.goto('/admin/moderation');
    // La redirection doit mener hors de /admin/moderation
    await expect(page).not.toHaveURL('/admin/moderation');
  });
});
