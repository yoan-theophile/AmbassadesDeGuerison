import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression: sendNouvelleActivationAdmin était défini dans lib/email/templates.ts
// mais jamais appelé — documenté (CLAUDE.md, docs/qa-manuel-checklist-stagiaire.md
// étape 4.3) comme envoyé à la validation finale, aux côtés de sendValidationFinale,
// mais resté du code mort.
// Found by /qa on 2026-07-29
// Report: .gstack/qa-reports/qa-report-localhost-2026-07-29.md

const { mockSendValidationFinale, mockSendNouvelleActivationAdmin } = vi.hoisted(() => ({
  mockSendValidationFinale: vi.fn().mockResolvedValue(undefined),
  mockSendNouvelleActivationAdmin: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email/templates', () => ({
  sendValidationFinale: mockSendValidationFinale,
  sendNouvelleActivationAdmin: mockSendNouvelleActivationAdmin,
}));

const PROFILE = {
  id: 'profile-1',
  status: 'enrichment_pending',
  first_name: 'Camille',
  user_id: 'user-1',
  city: 'Lyon',
  country: 'France',
};

function buildAdminSupabaseMock() {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const select = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: PROFILE, error: null }) }),
  });
  const moderationInsert = vi.fn().mockResolvedValue({ error: null });

  return {
    from: vi.fn((table: string) => {
      if (table === 'host_profiles') return { select, update };
      if (table === 'moderation_log') return { insert: moderationInsert };
      throw new Error(`unexpected table ${table}`);
    }),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'camille@example.com' } } }),
      },
    },
  };
}

vi.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn().mockImplementation(async () => ({
    user: { id: 'admin-1' },
    supabase: buildAdminSupabaseMock(),
  })),
}));

describe('POST /api/admin/ambassadeurs/[id]/status — action validated', () => {
  beforeEach(() => {
    mockSendValidationFinale.mockClear();
    mockSendNouvelleActivationAdmin.mockClear();
  });

  it('envoie sendValidationFinale ET sendNouvelleActivationAdmin', async () => {
    const { POST } = await import('@/app/api/admin/ambassadeurs/[id]/status/route');

    const req = new Request('http://localhost/api/admin/ambassadeurs/profile-1/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'validated' }),
    });

    const res = await POST(
      req as unknown as import('next/server').NextRequest,
      { params: Promise.resolve({ id: 'profile-1' }) },
    );

    expect(res.status).toBe(200);
    expect(mockSendValidationFinale).toHaveBeenCalledWith('camille@example.com', 'Camille');
    expect(mockSendNouvelleActivationAdmin).toHaveBeenCalledWith('Camille', 'Lyon', 'France');
  });
});
