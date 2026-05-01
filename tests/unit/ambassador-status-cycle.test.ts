import { describe, it, expect } from 'vitest';

// Cycle complet de statuts ambassadeur v2
// pending_review → pre_approved → enrichment_pending → validated
//                                                     ↘ rejected
//                              ↘ rejected
// validated → suspended → validated (via reactiver)
// rejected → validated (via reactiver)

type AmbassadeurStatus =
  | 'pending_review'
  | 'pre_approved'
  | 'enrichment_pending'
  | 'validated'
  | 'suspended'
  | 'rejected';

type Action = 'pre_approved' | 'validated' | 'rejected' | 'suspended' | 'reactiver';

const ACTION_STATUS: Record<Action, AmbassadeurStatus> = {
  pre_approved: 'pre_approved',
  validated:    'validated',
  rejected:     'rejected',
  suspended:    'suspended',
  reactiver:    'validated',
};

// Transitions autorisées par statut courant
const ALLOWED_ACTIONS: Record<AmbassadeurStatus, Action[]> = {
  pending_review:     ['pre_approved', 'rejected'],
  pre_approved:       ['validated', 'rejected'],
  enrichment_pending: ['validated', 'rejected'],
  validated:          ['suspended'],
  suspended:          ['reactiver'],
  rejected:           ['reactiver'],
};

function applyAction(currentStatus: AmbassadeurStatus, action: Action): {
  ok: boolean;
  newStatus?: AmbassadeurStatus;
  error?: string;
} {
  if (!ALLOWED_ACTIONS[currentStatus]?.includes(action)) {
    return {
      ok: false,
      error: `Action '${action}' non autorisée depuis le statut '${currentStatus}'`,
    };
  }
  return { ok: true, newStatus: ACTION_STATUS[action] };
}

describe('Cycle de statuts ambassadeur v2 — transitions valides', () => {
  it('pending_review → pre_approved via pré-approuver', () => {
    const r = applyAction('pending_review', 'pre_approved');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('pre_approved');
  });

  it('pending_review → rejected via refuser', () => {
    const r = applyAction('pending_review', 'rejected');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('rejected');
  });

  it('pre_approved → validated via valider', () => {
    const r = applyAction('pre_approved', 'validated');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('enrichment_pending → validated', () => {
    const r = applyAction('enrichment_pending', 'validated');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('validated → suspended via suspendre', () => {
    const r = applyAction('validated', 'suspended');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('suspended');
  });

  it('suspended → validated via réactiver', () => {
    const r = applyAction('suspended', 'reactiver');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('rejected → validated via réintégrer', () => {
    const r = applyAction('rejected', 'reactiver');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });
});

describe('Cycle de statuts — transitions interdites', () => {
  it('ne peut pas valider directement depuis pending_review (doit passer par pre_approved)', () => {
    const r = applyAction('pending_review', 'validated');
    expect(r.ok).toBe(false);
  });

  it('ne peut pas suspendre depuis pending_review', () => {
    expect(applyAction('pending_review', 'suspended').ok).toBe(false);
  });

  it('ne peut pas réactiver depuis validated (n\'est pas suspendu)', () => {
    expect(applyAction('validated', 'reactiver').ok).toBe(false);
  });

  it('ne peut pas pré-approuver depuis validated', () => {
    expect(applyAction('validated', 'pre_approved').ok).toBe(false);
  });

  it('ne peut pas pré-approuver depuis suspended', () => {
    expect(applyAction('suspended', 'pre_approved').ok).toBe(false);
  });
});

describe('Cycle de statuts — propriétés invariantes', () => {
  it('reactiver aboutit toujours à validated (jamais à active)', () => {
    expect(ACTION_STATUS['reactiver']).toBe('validated');
    expect(ACTION_STATUS['reactiver']).not.toBe('active');
  });

  it('le statut active n\'existe plus dans le cycle v2', () => {
    const allStatuses = Object.keys(ALLOWED_ACTIONS) as AmbassadeurStatus[];
    expect(allStatuses).not.toContain('active');
  });

  it('chaque statut a au moins une action possible (sauf validated seul peut être terminal)', () => {
    const statuses = Object.keys(ALLOWED_ACTIONS) as AmbassadeurStatus[];
    for (const s of statuses) {
      expect(ALLOWED_ACTIONS[s].length).toBeGreaterThanOrEqual(1);
    }
  });
});
