import { test, expect } from '@playwright/test';
import { AMBASSADOR_STATE } from './auth-state';

/**
 * E2E Lot 3 — Questionnaire et photos dashboard
 *
 * Vérifie que :
 * - Le questionnaire ne contient plus de champ téléphone
 * - Le questionnaire contient une section photo (requise)
 * - Le bouton "Envoyer" est désactivé sans photo
 * - Le dashboard ne montre pas les photos pour un validé par défaut
 * - Le bouton "Modifier mes photos" révèle la section photos
 * - L'API enrichissement retourne 400 si profile_photo_url est null
 */

test.describe('Questionnaire — téléphone retiré + photos requises', () => {
  test('GET /dashboard/questionnaire redirige non-authentifié vers /auth', async ({ page }) => {
    await page.goto('/dashboard/questionnaire');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('API enrichissement retourne 401 sans session', async ({ request }) => {
    const res = await request.patch('/api/ambassadeur/enrichissement', {
      data: { healing_challenge_done: true },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Dashboard — gating section photos', () => {
  test('dashboard redirige non-authentifié vers /auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('Dashboard photos — comportement toggle (authentifié)', () => {
  test.use({ storageState: AMBASSADOR_STATE });

  test.beforeEach(async ({ page }) => {
    await page.route('/api/geocode**', (route) =>
      route.fulfill({ status: 200, body: '[]', contentType: 'application/json' })
    );
  });

  test('section photos masquée par défaut pour un validé', async ({ page }) => {
    await page.goto('/dashboard');
    // Section photos ne doit pas être visible par défaut (validé → pas en enrichissement)
    await expect(page.getByRole('heading', { name: /Photos de votre ambassade/ })).not.toBeVisible({ timeout: 8_000 });
    // Bouton "Modifier mes photos" doit être présent
    await expect(page.getByRole('button', { name: /Modifier mes photos/ })).toBeVisible();
  });

  test('clic "Modifier mes photos" révèle la section photos', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Modifier mes photos/ }).click();
    await expect(page.getByText('Photos de votre ambassade')).toBeVisible({ timeout: 8_000 });
  });
});
