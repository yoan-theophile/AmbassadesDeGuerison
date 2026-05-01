import { describe, it, expect } from 'vitest';

// Logique métier extraite de /api/admin/ambassadeurs/[id]/status
// Nouveau cycle v2 : pending_review → pre_approved → enrichment_pending → validated → suspended/rejected
// L'action 'reactiver' remet à validated depuis suspended ou rejected.

type Action = 'pre_approved' | 'validated' | 'rejected' | 'suspended' | 'reactiver';

const VALID_ACTIONS: Action[] = ['pre_approved', 'validated', 'rejected', 'suspended', 'reactiver'];

const ACTION_STATUS: Record<Action, string> = {
  pre_approved: 'pre_approved',
  validated:    'validated',
  rejected:     'rejected',
  suspended:    'suspended',
  reactiver:    'validated',
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

describe('Admin — validation des actions sur un ambassadeur (cycle v2)', () => {
  it('accepte pré-approuver depuis pending_review', () => {
    const r = validateAction('admin', 'pre_approved');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('pre_approved');
  });

  it('accepte valider définitivement', () => {
    const r = validateAction('admin', 'validated');
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

  it('rejette une action inconnue — 400', () => {
    const r = validateAction('admin', 'active');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toContain('pre_approved');
  });

  it('rejette "active" (ancien statut supprimé) — 400', () => {
    const r = validateAction('admin', 'active');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it('rejette un statut arbitraire — 400', () => {
    const r = validateAction('admin', 'hack');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });
});

describe('Admin — toutes les actions du cycle v2 sont reconnues', () => {
  it('5 actions valides', () => {
    expect(VALID_ACTIONS).toHaveLength(5);
  });

  it('active n\'est plus une action valide', () => {
    expect(VALID_ACTIONS).not.toContain('active');
  });

  it('reactiver mappe vers validated (pas vers active)', () => {
    expect(ACTION_STATUS['reactiver']).toBe('validated');
    expect(ACTION_STATUS['reactiver']).not.toBe('active');
  });
});
