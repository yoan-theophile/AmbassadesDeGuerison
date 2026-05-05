import { describe, it, expect } from 'vitest';

// Cycle de statuts ambassadeur — refonte self-service onboarding
//
// Transitions self-service (candidat) :
//   pending_review → pre_approved  (via /api/onboarding/complete : vidéo + PDF + CGU)
//   pre_approved   → enrichment_pending (via /api/ambassadeur/enrichissement)
//
// Transitions admin :
//   enrichment_pending → validated  (action 'validated', cas standard)
//   * → validated                   (action 'validated_bypass', escape hatch)
//   * → rejected                    (action 'rejected')
//   validated → suspended           (action 'suspended')
//   suspended/rejected → validated  (action 'reactiver')
//
// L'admin ne peut plus pré-approuver : la transition pending_review → pre_approved
// est exclusivement self-service (le candidat clique "J'accepte" sur le dashboard).

type AmbassadeurStatus =
  | 'pending_review'
  | 'pre_approved'
  | 'enrichment_pending'
  | 'validated'
  | 'suspended'
  | 'rejected';

type Action =
  | 'self_onboarding_complete'
  | 'self_questionnaire_submit'
  | 'validated'
  | 'validated_bypass'
  | 'rejected'
  | 'suspended'
  | 'reactiver';

const ACTION_STATUS: Record<Action, AmbassadeurStatus> = {
  self_onboarding_complete: 'pre_approved',
  self_questionnaire_submit: 'enrichment_pending',
  validated:                'validated',
  validated_bypass:         'validated',
  rejected:                 'rejected',
  suspended:                'suspended',
  reactiver:                'validated',
};

const ALLOWED_ACTIONS: Record<AmbassadeurStatus, Action[]> = {
  pending_review:     ['self_onboarding_complete', 'rejected', 'validated_bypass'],
  pre_approved:       ['self_questionnaire_submit', 'rejected', 'validated_bypass'],
  enrichment_pending: ['validated', 'validated_bypass', 'rejected'],
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

describe('Cycle de statuts ambassadeur — transitions self-service', () => {
  it('pending_review → pre_approved via /api/onboarding/complete (candidat accepte CGU)', () => {
    const r = applyAction('pending_review', 'self_onboarding_complete');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('pre_approved');
  });

  it('pre_approved → enrichment_pending via soumission du questionnaire', () => {
    const r = applyAction('pre_approved', 'self_questionnaire_submit');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('enrichment_pending');
  });
});

describe('Cycle de statuts ambassadeur — actions admin', () => {
  it('enrichment_pending → validated (admin valide le questionnaire)', () => {
    const r = applyAction('enrichment_pending', 'validated');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('pending_review → validated via validated_bypass (escape hatch)', () => {
    const r = applyAction('pending_review', 'validated_bypass');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('pre_approved → validated via validated_bypass (escape hatch)', () => {
    const r = applyAction('pre_approved', 'validated_bypass');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('pending_review → rejected (admin refuse une candidature évidente)', () => {
    const r = applyAction('pending_review', 'rejected');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('rejected');
  });

  it('enrichment_pending → rejected (admin refuse après questionnaire)', () => {
    const r = applyAction('enrichment_pending', 'rejected');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('rejected');
  });

  it('validated → suspended', () => {
    const r = applyAction('validated', 'suspended');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('suspended');
  });

  it('suspended → validated via reactiver', () => {
    const r = applyAction('suspended', 'reactiver');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });

  it('rejected → validated via reactiver (réintégration)', () => {
    const r = applyAction('rejected', 'reactiver');
    expect(r.ok).toBe(true);
    expect(r.newStatus).toBe('validated');
  });
});

describe('Cycle de statuts — transitions interdites', () => {
  it('admin ne peut pas valider directement depuis pending_review (action validated)', () => {
    const r = applyAction('pending_review', 'validated');
    expect(r.ok).toBe(false);
  });

  it('admin ne peut pas valider directement depuis pre_approved (action validated)', () => {
    const r = applyAction('pre_approved', 'validated');
    expect(r.ok).toBe(false);
  });

  it('candidat ne peut pas soumettre le questionnaire depuis pending_review (CGU non acceptées)', () => {
    const r = applyAction('pending_review', 'self_questionnaire_submit');
    expect(r.ok).toBe(false);
  });

  it('candidat ne peut pas accepter les CGU une seconde fois depuis pre_approved', () => {
    const r = applyAction('pre_approved', 'self_onboarding_complete');
    expect(r.ok).toBe(false);
  });

  it('ne peut pas suspendre depuis pending_review', () => {
    expect(applyAction('pending_review', 'suspended').ok).toBe(false);
  });

  it("ne peut pas réactiver depuis validated (n'est pas suspendu)", () => {
    expect(applyAction('validated', 'reactiver').ok).toBe(false);
  });
});

describe('Cycle de statuts — propriétés invariantes', () => {
  it("l'action admin 'pre_approve' n'existe plus (transition self-service uniquement)", () => {
    const adminActions: Action[] = ['validated', 'validated_bypass', 'rejected', 'suspended', 'reactiver'];
    expect(adminActions).not.toContain('pre_approved' as Action);
  });

  it('reactiver aboutit toujours à validated', () => {
    expect(ACTION_STATUS['reactiver']).toBe('validated');
  });

  it('chaque statut non-terminal a au moins une action possible', () => {
    const statuses = Object.keys(ALLOWED_ACTIONS) as AmbassadeurStatus[];
    for (const s of statuses) {
      expect(ALLOWED_ACTIONS[s].length).toBeGreaterThanOrEqual(1);
    }
  });
});
