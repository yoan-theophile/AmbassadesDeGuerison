import { test, expect } from '@playwright/test';

/**
 * E2E : Disponibilité des nouvelles pages publiques v2
 * Vérifie que les pages répondent correctement (200 ou redirect approprié)
 * sans nécessiter d'authentification
 */
test.describe('Pages publiques v2 — disponibilité', () => {
  test('/faq répond 200', async ({ page }) => {
    const res = await page.goto('/faq');
    expect(res?.status()).toBe(200);
  });

  test('/faq contient au moins 5 questions', async ({ page }) => {
    await page.goto('/faq');
    const questions = page.locator('summary');
    const count = await questions.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('/contact-equipe répond 200', async ({ page }) => {
    const res = await page.goto('/contact-equipe');
    expect(res?.status()).toBe(200);
  });

  test('/temoignages/nouveau répond 200', async ({ page }) => {
    const res = await page.goto('/temoignages/nouveau');
    expect(res?.status()).toBe(200);
  });

  test('/visitor/[token] invalide retourne 404', async ({ page }) => {
    const res = await page.goto('/visitor/token-inexistant-000000000000');
    expect(res?.status()).toBe(404);
  });

  test('/accueillir/[token] invalide retourne 404', async ({ page }) => {
    const res = await page.goto('/accueillir/token-inexistant-000000000000');
    expect(res?.status()).toBe(404);
  });

  test('/feedback/[token] invalide retourne 404', async ({ page }) => {
    const res = await page.goto('/feedback/token-inexistant-000000000000');
    expect(res?.status()).toBe(404);
  });
});
