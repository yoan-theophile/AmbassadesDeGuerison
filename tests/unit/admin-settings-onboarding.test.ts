import { describe, it, expect } from 'vitest';

// Logique metier extraite de /api/admin/settings/onboarding

type UserRole = string | undefined;

function validateSettingsPayload(
  role: UserRole,
  body: unknown
): { ok: boolean; status: number; error?: string } {
  if (!role) return { ok: false, status: 401, error: 'Non authentifie.' };
  if (role !== 'admin') return { ok: false, status: 403, error: 'Acces refuse.' };

  const b = body as Record<string, unknown>;
  if (typeof b?.video_url !== 'string' || typeof b?.pdf_url !== 'string') {
    return { ok: false, status: 400, error: 'Champs invalides.' };
  }

  return { ok: true, status: 200 };
}

describe("Admin settings onboarding — validation acces", () => {
  it("accepte un admin avec des champs valides", () => {
    const result = validateSettingsPayload('admin', {
      video_url: 'https://www.youtube.com/embed/ABC123',
      pdf_url: '/docs/guide.pdf',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it("accepte video_url vide — le fallback est gere cote GET", () => {
    const result = validateSettingsPayload('admin', { video_url: '', pdf_url: '/docs/guide.pdf' });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it("rejette une requete sans utilisateur — 401", () => {
    const result = validateSettingsPayload(undefined, { video_url: 'url', pdf_url: 'path' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it("rejette un role non-admin (host) — 403", () => {
    const result = validateSettingsPayload('host', { video_url: 'url', pdf_url: 'path' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  it("rejette un role non-admin (ambassador) — 403", () => {
    const result = validateSettingsPayload('ambassador', { video_url: 'url', pdf_url: 'path' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });
});

describe("Admin settings onboarding — validation payload", () => {
  it("rejette video_url null — 400", () => {
    const result = validateSettingsPayload('admin', { video_url: null, pdf_url: '/docs/guide.pdf' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejette pdf_url non-string (nombre) — 400", () => {
    const result = validateSettingsPayload('admin', {
      video_url: 'https://www.youtube.com/embed/X',
      pdf_url: 42,
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejette un body vide — 400", () => {
    const result = validateSettingsPayload('admin', {});
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it("rejette video_url absent — 400", () => {
    const result = validateSettingsPayload('admin', { pdf_url: '/docs/guide.pdf' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });
});
