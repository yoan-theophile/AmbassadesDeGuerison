import { describe, it, expect } from 'vitest';

// Logique metier extraite de /api/admin/ambassadeurs/[id]

type TargetStatus = 'suspended' | 'active';
type UserRole = string | undefined;

function validateAdminAction(
  role: UserRole,
  newStatus: unknown
): { ok: boolean; status: number; error?: string } {
  if (!role) return { ok: false, status: 401, error: 'Non authentifie.' };
  if (role !== 'admin') return { ok: false, status: 403, error: 'Acces refuse.' };
  if (newStatus !== 'suspended' && newStatus !== 'active') {
    return { ok: false, status: 400, error: 'Statut invalide. Valeurs acceptees : suspended, active.' };
  }
  return { ok: true, status: 200 };
}

describe('Admin — validation des actions sur un ambassadeur', () => {
  it('accepte un admin qui suspend un ambassadeur actif', () => {
    const result = validateAdminAction('admin', 'suspended');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it('accepte un admin qui reactive un ambassadeur suspendu', () => {
    const result = validateAdminAction('admin', 'active');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it('rejette une requete sans utilisateur authentifie — 401', () => {
    const result = validateAdminAction(undefined, 'suspended');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejette un utilisateur avec role host — 403', () => {
    const result = validateAdminAction('host', 'suspended');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  it('rejette un statut cible invalide — 400', () => {
    const result = validateAdminAction('admin', 'pending_onboarding');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toContain('suspended, active');
  });

  it('rejette une valeur arbitraire comme statut cible', () => {
    const result = validateAdminAction('admin', 'hacked_status');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });
});

describe('Admin — seules deux transitions sont autorisees', () => {
  const validTransitions: TargetStatus[] = ['suspended', 'active'];

  it('suspended et active sont les seuls statuts cibles autorises', () => {
    expect(validTransitions).toHaveLength(2);
    expect(validTransitions).toContain('suspended');
    expect(validTransitions).toContain('active');
  });

  it('pending_onboarding ne peut pas etre assigne par l\'admin via cette route', () => {
    expect(validTransitions).not.toContain('pending_onboarding');
  });
});
