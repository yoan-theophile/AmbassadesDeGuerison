import { test, expect } from '@playwright/test';
import { SOPHIE_STATE } from './auth-state';

// Mute le statut DB de Sophie entre tests — exécution sérielle obligatoire pour
// éviter les courses (un test la met en pre_approved pendant qu'un autre attend
// pending_review).
test.describe.configure({ mode: 'serial' });

/**
 * E2E — refonte self-service onboarding (couverture API)
 *
 * Vérifie le parcours pending_review → pre_approved sans intervention admin.
 * Nécessite : supabase start + node scripts/seed.js (sophie.leroux@demo.fr en pending_review).
 *
 * Ces tests couvrent les invariants API critiques (auth, transition, idempotence,
 * statuts terminaux). La validation visuelle du gate dashboard (vidéo + PDF +
 * checkbox + bouton) se fait via QA manuel Playwright MCP — l'iframe blur
 * detection et le re-render React ne sont pas déterministes en headless.
 */

const SOPHIE_EMAIL = 'sophie.leroux@demo.fr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function setSophieStatus(status: 'pending_review' | 'pre_approved' | 'enrichment_pending' | 'validated' | 'suspended') {
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

test.describe('Onboarding self-service — API parcours candidat', () => {
  test.use({ storageState: SOPHIE_STATE });

  test.beforeEach(async () => {
    await setSophieStatus('pending_review');
  });

  test.afterAll(async () => {
    await setSophieStatus('pending_review');
  });

  test('PATCH /api/onboarding/complete fait passer pending_review → pre_approved', async ({ request }) => {
    const res = await request.patch('/api/onboarding/complete');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('pre_approved');
  });

  test('PATCH /api/onboarding/complete est idempotent (200 noop si déjà pre_approved)', async ({ request }) => {
    const first = await request.patch('/api/onboarding/complete');
    expect(first.status()).toBe(200);

    const second = await request.patch('/api/onboarding/complete');
    expect(second.status()).toBe(200);
    const body = await second.json();
    expect(body.status).toBe('pre_approved');
  });

  test('PATCH /api/onboarding/complete depuis suspended retourne 400', async ({ request }) => {
    await setSophieStatus('suspended');

    const res = await request.patch('/api/onboarding/complete');
    expect(res.status()).toBe(400);

    await setSophieStatus('pending_review');
  });
});
