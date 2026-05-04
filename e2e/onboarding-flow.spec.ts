import { test, expect } from '@playwright/test';
import { SOPHIE_STATE } from './auth-state';

/**
 * E2E — refonte self-service onboarding
 *
 * Vérifie le parcours pending_review → pre_approved sans intervention admin.
 * Nécessite : supabase start + node scripts/seed.js (sophie.leroux@demo.fr en pending_review).
 */

const SOPHIE_EMAIL = 'sophie.leroux@demo.fr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function setSophieStatus(status: 'pending_review' | 'pre_approved' | 'enrichment_pending' | 'validated') {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase env manquant pour reset status. Vérifier .env.local.');
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/host_profiles?email=eq.${encodeURIComponent(SOPHIE_EMAIL)}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(`Failed to reset Sophie status: ${res.status} ${await res.text()}`);
  }
}

test.describe('Onboarding self-service — accès non authentifié', () => {
  test('PATCH /api/onboarding/complete sans session retourne 401', async ({ request }) => {
    const res = await request.patch('/api/onboarding/complete');
    expect(res.status()).toBe(401);
  });

  test('GET /onboarding (legacy) retourne 404', async ({ page }) => {
    const response = await page.goto('/onboarding');
    expect(response?.status()).toBe(404);
  });
});

test.describe('Onboarding self-service — parcours candidat (Sophie pending_review)', () => {
  test.use({ storageState: SOPHIE_STATE });

  test.beforeEach(async () => {
    await setSophieStatus('pending_review');
  });

  test.afterAll(async () => {
    // Nettoyage : remettre Sophie à pending_review pour les autres specs
    await setSophieStatus('pending_review');
  });

  test('le dashboard affiche la vidéo de formation, le PDF et la checkbox CGU', async ({ page }) => {
    await page.goto('/dashboard');

    // Encart de bienvenue actif (et non plus passif "candidature reçue, attendre")
    await expect(page.getByText(/Bienvenue/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/regarde la vidéo/i)).toBeVisible();

    // Vidéo de formation présente
    await expect(page.locator('iframe[title*="Formation ambassadeur"]')).toBeVisible();

    // PDF guide pratique
    await expect(page.getByRole('link', { name: /Télécharger/i })).toBeVisible();

    // Checkbox CGU + bouton "Activer mon onboarding"
    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(page.getByRole('button', { name: /Activer mon onboarding/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Activer mon onboarding/i })).toBeDisabled();
  });

  test('PATCH /api/onboarding/complete fait passer pending_review → pre_approved', async ({ request }) => {
    const res = await request.patch('/api/onboarding/complete');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('pre_approved');
  });

  test('PATCH /api/onboarding/complete est idempotent (200 noop si déjà pre_approved)', async ({ request }) => {
    // Premier appel : transition
    const first = await request.patch('/api/onboarding/complete');
    expect(first.status()).toBe(200);

    // Second appel : noop
    const second = await request.patch('/api/onboarding/complete');
    expect(second.status()).toBe(200);
    const body = await second.json();
    expect(body.status).toBe('pre_approved');
  });

  test('après transition, le dashboard montre l\'encart "Conditions acceptées" et le CTA questionnaire', async ({ page, request }) => {
    // Déclenche la transition via l'API
    const res = await request.patch('/api/onboarding/complete');
    expect(res.status()).toBe(200);

    await page.goto('/dashboard');

    await expect(page.getByText(/Conditions acceptées/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Compléter mon profil/i })).toBeVisible();
  });
});

test.describe('Onboarding self-service — refus sur statuts terminaux', () => {
  test.use({ storageState: SOPHIE_STATE });

  test('PATCH /api/onboarding/complete depuis suspended retourne 400', async ({ request }) => {
    await setSophieStatus('validated');
    // suspended via API admin nécessiterait un admin auth ; on pose suspended directement via service_role
    if (!SUPABASE_URL || !SERVICE_KEY) test.skip(true, 'env Supabase manquant');
    await fetch(`${SUPABASE_URL}/rest/v1/host_profiles?email=eq.${encodeURIComponent(SOPHIE_EMAIL)}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ status: 'suspended' }),
    });

    const res = await request.patch('/api/onboarding/complete');
    expect(res.status()).toBe(400);

    // Cleanup
    await setSophieStatus('pending_review');
  });
});
