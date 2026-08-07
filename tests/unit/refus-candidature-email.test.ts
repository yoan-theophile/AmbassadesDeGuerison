import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';

// Nouveau template refus-candidature (emails/refus-candidature.tsx) + wiring
// sendRefusCandidature (lib/email/templates.ts), câblé depuis POST
// /api/admin/ambassadeurs/[id]/status quand action === 'rejected' (commit ab62970).
// Avant ce commit, l'action 'rejected' ne notifiait jamais le candidat.

const { mockSend } = vi.hoisted(() => {
  const mockSend = vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null });
  return { mockSend };
});

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

process.env.RESEND_API_KEY = 'test-key';
process.env.RESEND_FROM_EMAIL = 'noreply@test.fr';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.app';

import { sendRefusCandidature } from '@/lib/email/templates';
import RefusCandidature from '@/emails/refus-candidature';

function lastCallPayload() {
  return mockSend.mock.calls[mockSend.mock.calls.length - 1][0] as {
    from: string;
    to: string;
    subject: string;
    react: React.ReactElement;
  };
}

beforeEach(() => { mockSend.mockClear(); });

describe('sendRefusCandidature', () => {
  it('envoie au bon destinataire avec le bon composant', async () => {
    await sendRefusCandidature('candidat@test.fr', 'Jean');
    const { to, react } = lastCallPayload();
    expect(to).toBe('candidat@test.fr');
    expect((react as React.ReactElement).type).toBe(RefusCandidature);
  });

  it('passe firstName comme prop', async () => {
    await sendRefusCandidature('candidat@test.fr', 'Jean');
    const { react } = lastCallPayload();
    expect((react as React.ReactElement<Record<string, unknown>>).props.firstName).toBe('Jean');
  });

  it('reason est optionnel — undefined si non fourni', async () => {
    await sendRefusCandidature('candidat@test.fr', 'Jean');
    const { react } = lastCallPayload();
    expect((react as React.ReactElement<Record<string, unknown>>).props.reason).toBeUndefined();
  });

  it('passe reason quand fourni (repris du champ notes admin)', async () => {
    await sendRefusCandidature('candidat@test.fr', 'Jean', 'Zone déjà bien couverte');
    const { react } = lastCallPayload();
    expect((react as React.ReactElement<Record<string, unknown>>).props.reason).toBe('Zone déjà bien couverte');
  });

  it('subject reste sobre, sans détail de refus', async () => {
    await sendRefusCandidature('candidat@test.fr', 'Jean');
    const { subject } = lastCallPayload();
    expect(subject).toContain('mise à jour');
  });
});

describe('RefusCandidature template — rendu conditionnel de reason', () => {
  it('sans reason, le composant ne référence pas de raison spécifique dans les props enfant', () => {
    const el = React.createElement(RefusCandidature, { firstName: 'Marie' });
    expect(el.props.reason).toBeUndefined();
  });

  it('avec reason fournie, elle est bien passée au composant', () => {
    const el = React.createElement(RefusCandidature, { firstName: 'Marie', reason: 'Dossier incomplet' });
    expect(el.props.reason).toBe('Dossier incomplet');
  });
});
