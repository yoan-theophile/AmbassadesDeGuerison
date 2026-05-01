import { describe, it, expect } from 'vitest';

// Logique de la fenêtre de feedback post-live
// extraite de /api/cron/send-feedback-emails

function isInFeedbackWindow(
  eventDate: Date,
  now: Date,
  feedbackDaysAfter: number,
): boolean {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - feedbackDaysAfter - 1);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() - feedbackDaysAfter);

  return eventDate >= windowStart && eventDate <= windowEnd;
}

describe('Fenêtre feedback post-live', () => {
  const now = new Date('2024-06-15T10:00:00Z');
  const daysAfter = 1;

  it('un event J-1 est dans la fenêtre', () => {
    const eventDate = new Date('2024-06-14T10:00:00Z');
    expect(isInFeedbackWindow(eventDate, now, daysAfter)).toBe(true);
  });

  it('un event J-2 est dans la fenêtre (borne windowStart)', () => {
    const eventDate = new Date('2024-06-13T10:00:00Z');
    expect(isInFeedbackWindow(eventDate, now, daysAfter)).toBe(true);
  });

  it('un event aujourd\'hui n\'est pas encore dans la fenêtre', () => {
    const eventDate = new Date('2024-06-15T10:00:00Z');
    expect(isInFeedbackWindow(eventDate, now, daysAfter)).toBe(false);
  });

  it('un event J-3 est hors fenêtre (trop ancien)', () => {
    const eventDate = new Date('2024-06-12T10:00:00Z');
    expect(isInFeedbackWindow(eventDate, now, daysAfter)).toBe(false);
  });

  it('fonctionne avec feedbackDaysAfter=2', () => {
    const eventDate = new Date('2024-06-13T10:00:00Z'); // J-2
    expect(isInFeedbackWindow(eventDate, now, 2)).toBe(true);
  });

  it('exclut un event trop récent avec feedbackDaysAfter=2', () => {
    const eventDate = new Date('2024-06-14T10:00:00Z'); // J-1
    expect(isInFeedbackWindow(eventDate, now, 2)).toBe(false);
  });
});

describe('Fenêtre auto-decline', () => {
  function shouldAutoDecline(
    eventDate: Date,
    now: Date,
    daysBefore: number,
  ): boolean {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + daysBefore);
    return eventDate <= cutoff;
  }

  const now = new Date('2024-06-15T10:00:00Z');

  it('decline si event dans moins de 2 jours', () => {
    const tomorrow = new Date('2024-06-16T10:00:00Z');
    expect(shouldAutoDecline(tomorrow, now, 2)).toBe(true);
  });

  it('ne décline pas si event dans 5 jours', () => {
    const future = new Date('2024-06-20T10:00:00Z');
    expect(shouldAutoDecline(future, now, 2)).toBe(false);
  });

  it('decline exactement à la limite (J+2)', () => {
    const limit = new Date('2024-06-17T10:00:00Z');
    expect(shouldAutoDecline(limit, now, 2)).toBe(true);
  });
});
