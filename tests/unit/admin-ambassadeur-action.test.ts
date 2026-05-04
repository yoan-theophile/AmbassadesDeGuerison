import { describe, it, expect } from 'vitest';

// Logique métier extraite de /api/admin/ambassadeurs/[id]/status
// Refonte self-service onboarding : l'action 'pre_approved' n'existe plus côté admin —
// la transition pending_review → pre_approved est désormais self-service (candidat).

type Action = 'validated' | 'validated_bypass' | 'rejected' | 'suspended' | 'reactiver';

const VALID_ACTIONS: Action[] = ['validated', 'validated_bypass', 'rejected', 'suspended', 'reactiver'];

const ACTION_STATUS: Record<Action, string> = {
  validated:        'validated',
  validated_bypass: 'validated',
  rejected:         'rejected',
  suspended:        'suspended',
  reactiver:        'validated',
};

function validateAction(
  role: string | undefined,
  action: unknown,
): { ok: boolean; status: number; error?: string; newStatus?: string } {
  if (!role) return { ok: false, status: 401, error: 'Non authentifié.' };
  if (role !== 'admin') return { ok: false, status: 403, error: 'Accès refusé.' };
  if (!VALID_ACTIONS.includes(action as Action)) {
    return { ok: false, status: 400, error: `Action invalide. Valeurs : ${VALID_ACTIONS.join(', ')}.` };
  }
  return { ok: true, status: 200, newStatus: ACTION_STATUS[action as Action] };
}

describe('Admin — validation des actions sur un ambassadeur (self-service onboarding)', () => {
  it('accepte valider depuis enrichment_pending', () => {
    const r = validateAction('admin', 'validated');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('accepte validated_bypass (escape hatch)', () => {
    const r = validateAction('admin', 'validated_bypass');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('accepte rejeter', () => {
    const r = validateAction('admin', 'rejected');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('rejected');
  });

  it('accepte suspendre un ambassadeur validé', () => {
    const r = validateAction('admin', 'suspended');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('suspended');
  });

  it('reactiver remet à validated', () => {
    const r = validateAction('admin', 'reactiver');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('rejette sans utilisateur — 401', () => {
    const r = validateAction(undefined, 'validated');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });

  it('rejette un rôle non-admin — 403', () => {
    const r = validateAction('host', 'validated');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(403);
  });

  it("rejette l'ancienne action 'pre_approved' (devenue self-service) — 400", () => {
    const r = validateAction('admin', 'pre_approved');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toContain('validated_bypass');
  });

  it('rejette une action inconnue — 400', () => {
    const r = validateAction('admin', 'hack');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it('rejette "active" (ancien statut supprimé) — 400', () => {
    const r = validateAction('admin', 'active');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });
});

describe('Admin — toutes les actions du nouveau cycle sont reconnues', () => {
  it('5 actions admin valides (sans pre_approved)', () => {
    expect(VALID_ACTIONS).toHaveLength(5);
    expect(VALID_ACTIONS).not.toContain('pre_approved' as Action);
  });

  it("active n'est plus une action valide", () => {
    expect(VALID_ACTIONS).not.toContain('active' as Action);
  });

  it('reactiver mappe vers validated (pas vers active)', () => {
    expect(ACTION_STATUS['reactiver']).toBe('validated');
  });

  it('validated_bypass mappe aussi vers validated', () => {
    expect(ACTION_STATUS['validated_bypass']).toBe('validated');
  });
});
