import { describe, it, expect, vi } from 'vitest';

// Regression: ISSUE-001 — POST /api/visitor/account crashait au chargement du
// module ("TypeError: Super expression must either be null or a function")
// car isValidPhoneNumber était importé depuis react-phone-number-input, un
// package qui embarque des composants React (extends React.Component),
// incompatible avec le contexte Node.js d'une route API.
// Found by /qa on 2026-07-29
// Report: .gstack/qa-reports/qa-report-localhost-2026-07-29.md
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}));
vi.mock('@/lib/visitor/classify-email', () => ({
  classifyVisitorEmail: vi.fn().mockResolvedValue('new'),
}));
vi.mock('@/lib/image/compress-photo', () => ({
  compressAmbassadorPhoto: vi.fn(),
}));
vi.mock('@/lib/email/templates', () => ({
  sendVisitorCompteCree: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/visitor/account — import du module', () => {
  // Timeout élargi : l'import dynamique prend <200ms isolé, mais peut dépasser
  // le défaut vitest de 5000ms sous la contention CPU/IO d'une full suite
  // (40 fichiers en parallèle) — flaky observé en suite complète, jamais en
  // isolation (cf investigation 2026-08-20).
  it("charge le module sans lever d'exception (import isValidPhoneNumber côté serveur)", async () => {
    await expect(import('@/app/api/visitor/account/route')).resolves.toBeDefined();
  }, 20000);

  it('rejette un numéro de téléphone invalide avec un 400 propre (pas un crash)', async () => {
    const { POST } = await import('@/app/api/visitor/account/route');

    const formData = new FormData();
    formData.append('first_name', 'Test');
    formData.append('email', 'test@example.com');
    formData.append('phone', '12345'); // invalide

    const req = new Request('http://localhost/api/visitor/account', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/téléphone invalide/i);
  });

  it('accepte un numéro E.164 valide (isValidPhoneNumber fonctionne réellement)', async () => {
    const { isValidPhoneNumber } = await import('libphonenumber-js');
    expect(isValidPhoneNumber('+33612345678')).toBe(true);
    expect(isValidPhoneNumber('12345')).toBe(false);
  });
});
