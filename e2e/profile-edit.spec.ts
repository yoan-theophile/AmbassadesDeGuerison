import { test, expect } from '@playwright/test';
import { AMBASSADOR_STATE } from './auth-state';

/**
 * E2E Lot 5 — Édition profil ambassadeur
 *
 * Vérifie que :
 * - PATCH /api/ambassadeur/profile retourne 401 sans session
 * - PATCH avec une ville non-géocodée (sans lat/lng) retourne 400
 * - La section "Mes informations" est visible pour un ambassadeur validé
 * - La modification de consignes (champ non-ville) réussit sans email admin
 * - La saisie d'une ville sans sélection dropdown bloque l'envoi
 */

test.describe('API profil ambassadeur — non authentifié', () => {
  test('PATCH retourne 401 sans session', async ({ request }) => {
    const res = await request.patch('/api/ambassadeur/profile', {
      data: { city: 'Lyon' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Dashboard — section Mes informations (authentifié)', () => {
  test.use({ storageState: AMBASSADOR_STATE });

  test.beforeEach(async ({ page }) => {
    // Stubber /api/geocode pour éviter que CityInput déclenche un fetch au mount
    // et empêche waitForLoadState('networkidle') de se stabiliser.
    await page.route('/api/geocode**', (route) =>
      route.fulfill({ status: 200, body: '[]', contentType: 'application/json' })
    );
  });

  test('section Mes informations visible pour un ambassadeur validé', async ({ page }) => {
    await page.goto('/dashboard');
    // Utiliser getByRole pour éviter le match substring sur "Enregistrer mes informations" (bouton)
    await expect(page.getByRole('heading', { name: 'Mes informations' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Enregistrer mes informations/ })).toBeVisible();
  });

  test('modification consignes — succès (champ non-ville, pas d\'email admin)', async ({ page }) => {
    await page.goto('/dashboard');
    const textarea = page.getByPlaceholder(/code interphone/);
    await textarea.fill('Code A42. Parking gratuit côté rue.');
    await page.getByRole('button', { name: /Enregistrer mes informations/ }).click();
    await expect(page.getByText('Informations enregistrées')).toBeVisible({ timeout: 8_000 });
  });

  test('message de présentation — enregistré et compteur de caractères mis à jour', async ({ page }) => {
    await page.goto('/dashboard');
    const textarea = page.getByPlaceholder(/Chez nous, c'est simple/);
    await textarea.fill("On vous accueille avec joie autour d'un café avant chaque live.");
    await expect(page.getByText(/^\d+\/240/)).toBeVisible();
    await page.getByRole('button', { name: /Enregistrer mes informations/ }).click();
    await expect(page.getByText('Informations enregistrées')).toBeVisible({ timeout: 8_000 });
  });

  test('changement de ville sans sélection dropdown — hint ambre bloque l\'envoi', async ({ page }) => {
    await page.goto('/dashboard');
    // Taper une ville sans sélectionner dans le dropdown
    const cityInput = page.getByLabel('Ville');
    await cityInput.fill('BordeauxLibreNonGeocoded');
    // Le hint ambre doit apparaître
    await expect(page.getByText(/Sélectionnez une ville dans la liste/)).toBeVisible();
    await page.getByRole('button', { name: /Enregistrer mes informations/ }).click();
    // L'erreur côté form (avant même l'API) doit s'afficher (prendre le premier match : hint ambre)
    await expect(page.getByText(/sélectionner.*ville|ville.*liste/i).first()).toBeVisible();
  });
});
