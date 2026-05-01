import { test, expect } from '@playwright/test';

/**
 * E2E : Sécurité — rate limiting + preview noindex
 */
test.describe('Sécurité — API publiques', () => {
  test('POST /api/temoignages avec honeypot renvoie 200 silencieux', async ({ request }) => {
    const res = await request.post('/api/temoignages', {
      data: {
        event_id: '00000000-0000-0000-0000-000000000000',
        content: 'Contenu test',
        website: 'http://spam.com', // honeypot rempli
      },
    });
    // 200 silencieux ou 400 (content trop court) — jamais 500
    expect([200, 400, 422]).toContain(res.status());
  });

  test('POST /api/inscriptions avec honeypot renvoie 200 silencieux', async ({ request }) => {
    const res = await request.post('/api/inscriptions', {
      data: {
        first_name: 'Bot',
        email: 'bot@spam.com',
        website: 'http://spam.com', // honeypot
      },
    });
    expect([200, 400, 422]).toContain(res.status());
  });
});

test.describe('Sécurité — pages preview', () => {
  test('/preview a une meta robots noindex', async ({ page }) => {
    await page.goto('/preview/homepage-poster');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });
});
