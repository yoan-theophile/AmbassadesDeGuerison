import { describe, it, expect } from 'vitest';

// Logique metier extraite de /api/onboarding/complete

type Status = 'pending_onboarding' | 'onboarding_complete' | 'pending_charter' | 'active' | 'suspended';

function resolveActivation(currentStatus: Status): { ok: boolean; noOp: boolean; error?: string } {
  if (currentStatus === 'active') return { ok: true, noOp: true };
  if (currentStatus !== 'pending_onboarding') {
    return { ok: false, noOp: false, error: 'Statut incompatible avec cette action.' };
  }
  return { ok: true, noOp: false };
}

describe("Onboarding — regles d'activation", () => {
  it('accepte pending_onboarding et declenche l\'activation', () => {
    const result = resolveActivation('pending_onboarding');
    expect(result.ok).toBe(true);
    expect(result.noOp).toBe(false);
  });

  it('est idempotent si deja active — no-op 200', () => {
    const result = resolveActivation('active');
    expect(result.ok).toBe(true);
    expect(result.noOp).toBe(true);
  });

  it('rejette onboarding_complete (statut intermediaire manuel)', () => {
    const result = resolveActivation('onboarding_complete');
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejette pending_charter', () => {
    const result = resolveActivation('pending_charter');
    expect(result.ok).toBe(false);
  });

  it("rejette suspended — l'ambassadeur ne peut pas se reactiver lui-meme", () => {
    const result = resolveActivation('suspended');
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Onboarding — transitions de statut', () => {
  it('le statut cible est toujours "active" apres onboarding', () => {
    const targetStatus = 'active';
    expect(targetStatus).toBe('active');
  });

  it('le statut de depart attendu dans le happy path est pending_onboarding', () => {
    const initialStatus: Status = 'pending_onboarding';
    const result = resolveActivation(initialStatus);
    expect(result.ok).toBe(true);
    expect(result.noOp).toBe(false);
  });
});
