import { describe, it, expect } from 'vitest';

// Logique métier des transitions de statut pour les contact_requests (visit-requests)

type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled_no_response';

function canAccept(status: RequestStatus): { ok: boolean; alreadyDone?: boolean } {
  if (status === 'accepted') return { ok: true, alreadyDone: true };
  if (status !== 'pending') return { ok: false };
  return { ok: true };
}

function canDecline(status: RequestStatus): { ok: boolean; alreadyDone?: boolean } {
  if (status === 'declined') return { ok: true, alreadyDone: true };
  if (status !== 'pending') return { ok: false };
  return { ok: true };
}

describe('contact_requests — transitions accept', () => {
  it('accepte une demande pending', () => {
    expect(canAccept('pending').ok).toBe(true);
    expect(canAccept('pending').alreadyDone).toBeUndefined();
  });

  it('idempotent si déjà accepted', () => {
    const r = canAccept('accepted');
    expect(r.ok).toBe(true);
    expect(r.alreadyDone).toBe(true);
  });

  it('bloque si declined', () => {
    expect(canAccept('declined').ok).toBe(false);
  });

  it('bloque si cancelled_no_response', () => {
    expect(canAccept('cancelled_no_response').ok).toBe(false);
  });
});

describe('contact_requests — transitions decline', () => {
  it('refuse une demande pending', () => {
    expect(canDecline('pending').ok).toBe(true);
    expect(canDecline('pending').alreadyDone).toBeUndefined();
  });

  it('idempotent si déjà declined', () => {
    const r = canDecline('declined');
    expect(r.ok).toBe(true);
    expect(r.alreadyDone).toBe(true);
  });

  it('bloque si accepted', () => {
    expect(canDecline('accepted').ok).toBe(false);
  });
});

describe('contact_requests — auto-decline deadline', () => {
  function shouldAutoDecline(
    eventDate: Date,
    now: Date,
    daysBefore: number,
  ): boolean {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + daysBefore);
    return eventDate <= cutoff;
  }

  it('auto-decline si event dans moins de X jours', () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(shouldAutoDecline(tomorrow, now, 2)).toBe(true);
  });

  it('ne décline pas si event dans plus de X jours', () => {
    const now = new Date();
    const inTenDays = new Date(now);
    inTenDays.setDate(inTenDays.getDate() + 10);
    expect(shouldAutoDecline(inTenDays, now, 2)).toBe(false);
  });
});
