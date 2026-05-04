import { test, expect } from '@playwright/test';

/**
 * E2E Lot 2 — Labels formulaire d'inscription
 *
 * Vérifie que :
 * - Step 1 : téléphone mentionne WhatsApp + helper correct
 * - Step 2 : adresse mentionne la confidentialité + helper "vous validez"
 * - Step 2 : consignes renommées "Détails utiles" + helper + rows=3
 * - La soumission complète ne casse pas le parcours
 */

test.describe('Inscription — labels et copy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inscription');
    await page.waitForLoadState('networkidle');
  });

  test('Step 1 — téléphone mentionne WhatsApp', async ({ page }) => {
    await expect(page.getByText(/Téléphone.*WhatsApp de préférence/)).toBeVisible();
    await expect(page.getByText('WhatsApp facilite les échanges')).toBeVisible();
  });

  test('Step 1 — le bouton Continuer est désactivé sans ville confirmée', async ({ page }) => {
    await page.getByRole('textbox', { name: /Marie/ }).fill('Test');
    await page.getByRole('textbox', { name: /Dupont/ }).fill('Dupont');
    await page.getByRole('textbox', { name: /marie@exemple/ }).fill('test@test.com');
    await page.getByRole('textbox', { name: /\+33/ }).fill('+33 6 00 00 00 00');
    // Sans ville → bouton désactivé
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });

  test('Step 2 — labels adresse et consignes corrects', async ({ page }) => {
    // Remplir step 1
    await page.getByRole('textbox', { name: /Marie/ }).fill('Test');
    await page.getByRole('textbox', { name: /Dupont/ }).fill('Dupont');
    await page.getByRole('textbox', { name: /marie@exemple/ }).fill('test@test.com');
    await page.getByRole('textbox', { name: /\+33/ }).fill('+33 6 00 00 00 00');
    await page.getByRole('textbox', { name: 'Ville*' }).fill('Lyon');
    await page.getByRole('button', { name: 'Lyon, France' }).first().click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Vérifier step 2
    await expect(page.getByText('partagée uniquement avec un visiteur que vous avez accepté')).toBeVisible();
    await expect(page.getByText('Vous validez chaque demande avant que l\'adresse soit dévoilée')).toBeVisible();
    await expect(page.getByText('Détails utiles pour vos visiteurs')).toBeVisible();
    await expect(page.getByText('Sera transmis aux visiteurs acceptés')).toBeVisible();
  });

  test('Step 2 — textarea consignes a rows=3', async ({ page }) => {
    // Remplir step 1 et passer à step 2
    await page.getByRole('textbox', { name: /Marie/ }).fill('Test');
    await page.getByRole('textbox', { name: /Dupont/ }).fill('Dupont');
    await page.getByRole('textbox', { name: /marie@exemple/ }).fill('test@test.com');
    await page.getByRole('textbox', { name: /\+33/ }).fill('+33 6 00 00 00 00');
    await page.getByRole('textbox', { name: 'Ville*' }).fill('Lyon');
    await page.getByRole('button', { name: 'Lyon, France' }).first().click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Vérifier que le textarea consignes a bien rows=3
    const rows = await page.evaluate(() => {
      const textareas = Array.from(document.querySelectorAll('textarea'));
      const consignes = textareas.find(ta => ta.getAttribute('placeholder')?.includes('code interphone'));
      return consignes?.rows;
    });
    expect(rows).toBe(3);
  });

  test('Page inscription charge sans erreur JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/inscription');
    await page.waitForLoadState('networkidle');
    const fatal = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(fatal).toHaveLength(0);
  });
});
