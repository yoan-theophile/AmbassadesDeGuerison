import { describe, it, expect } from 'vitest';

// Logique métier extraite de /api/onboarding/complete (refonte self-service onboarding).
// Cible : pending_review → pre_approved.
// Idempotent : déjà ≥ pre_approved → 200 noop.
// Refus : suspended/rejected → 400.

type Status =
  | 'pending_review'
  | 'pre_approved'
  | 'enrichment_pending'
  | 'validated'
  | 'suspended'
  | 'rejected';

const ADVANCED_STATUSES: Status[] = ['pre_approved', 'enrichment_pending', 'validated'];

function resolveOnboardingComplete(currentStatus: Status): {
  status: number;
  noOp: boolean;
  newStatus?: Status;
  error?: string;
} {
  if (ADVANCED_STATUSES.includes(currentStatus)) {
    return { status: 200, noOp: true, newStatus: currentStatus };
  }
  if (currentStatus !== 'pending_review') {
    return { status: 400, noOp: false, error: 'Statut incompatible avec cette action.' };
  }
  return { status: 200, noOp: false, newStatus: 'pre_approved' };
}

describe('Onboarding self-service — happy path', () => {
  it('pending_review → pre_approved (200)', () => {
    const r = resolveOnboardingComplete('pending_review');
    expect(r.status).toBe(200);
    expect(r.noOp).toBe(false);
    expect(r.newStatus).toBe('pre_approved');
  });
});

describe('Onboarding self-service — idempotence', () => {
  it('pre_approved : noop 200 (déjà accepté les CGU)', () => {
    const r = resolveOnboardingComplete('pre_approved');
    expect(r.status).toBe(200);
    expect(r.noOp).toBe(true);
    expect(r.newStatus).toBe('pre_approved');
  });

  it('enrichment_pending : noop 200 (a déjà soumis le questionnaire)', () => {
    const r = resolveOnboardingComplete('enrichment_pending');
    expect(r.status).toBe(200);
    expect(r.noOp).toBe(true);
  });

  it('validated : noop 200 (déjà ambassadeur actif)', () => {
    const r = resolveOnboardingComplete('validated');
    expect(r.status).toBe(200);
    expect(r.noOp).toBe(true);
  });
});

describe('Onboarding self-service — statuts terminaux', () => {
  it('suspended : 400 (un suspendu ne se réactive pas via onboarding)', () => {
    const r = resolveOnboardingComplete('suspended');
    expect(r.status).toBe(400);
    expect(r.noOp).toBe(false);
    expect(r.error).toBeDefined();
  });

  it('rejected : 400 (un refusé ne peut pas relancer la procédure)', () => {
    const r = resolveOnboardingComplete('rejected');
    expect(r.status).toBe(400);
    expect(r.error).toBeDefined();
  });
});

describe('Onboarding self-service — invariants', () => {
  it('le statut cible après transition est toujours pre_approved', () => {
    const r = resolveOnboardingComplete('pending_review');
    expect(r.newStatus).toBe('pre_approved');
  });

  it("la cible 'validated' ne peut plus être atteinte directement (ancien comportement supprimé)", () => {
    const r = resolveOnboardingComplete('pending_review');
    expect(r.newStatus).not.toBe('validated' as Status);
  });
});
