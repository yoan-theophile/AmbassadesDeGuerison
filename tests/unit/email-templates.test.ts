import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────────

// vi.hoisted garantit que mockSend est disponible dans la factory vi.mock (hoistée avant les imports)
const { mockSend } = vi.hoisted(() => {
  const mockSend = vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null });
  return { mockSend };
});

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

// Env vars nécessaires au module
process.env.RESEND_API_KEY = 'test-key';
process.env.RESEND_FROM_EMAIL = 'noreply@test.fr';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.app';
process.env.RESEND_ADMIN_EMAIL = 'admin@test.fr';

// ── Import après les mocks ─────────────────────────────────────────────────

import {
  sendMagicLink,
  sendBienvenueAmbassadeur,
  sendAcceptationVisite,
  sendCampagneAmbassadeurs,
  sendAdminAlertNoActivations,
  sendContactRequestReserved,
} from '@/lib/email/templates';

import MagicLink from '@/emails/magic-link';
import BienvenueAmbassadeur from '@/emails/bienvenue-ambassadeur';
import ContactAccepted from '@/emails/acceptation-visite';
import CampagneAmbassadeurs from '@/emails/campagne-ambassadeurs';
import AdminAlerteNoActivations from '@/emails/admin-alerte-no-activations';
import ContactReserved from '@/emails/contact-reserved';

// ── Helpers ────────────────────────────────────────────────────────────────

function lastCallPayload() {
  return mockSend.mock.calls[mockSend.mock.calls.length - 1][0] as {
    from: string;
    to: string;
    subject: string;
    react: React.ReactElement;
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => { mockSend.mockClear(); });

describe('sendMagicLink', () => {
  it('envoie au bon destinataire avec le bon composant', async () => {
    await sendMagicLink('user@test.fr', 'https://magic.link/token');
    const { to, react } = lastCallPayload();
    expect(to).toBe('user@test.fr');
    expect((react as React.ReactElement).type).toBe(MagicLink);
  });

  it('passe magicLinkUrl comme prop', async () => {
    await sendMagicLink('user@test.fr', 'https://magic.link/abc');
    const { react } = lastCallPayload();
    expect((react as React.ReactElement<Record<string, unknown>>).props.magicLinkUrl).toBe('https://magic.link/abc');
  });
});

describe('sendBienvenueAmbassadeur', () => {
  it('construit dashboardUrl et carteUrl depuis APP_URL', async () => {
    await sendBienvenueAmbassadeur('marie@test.fr', 'Marie');
    const { react } = lastCallPayload();
    const props = (react as React.ReactElement<Record<string, unknown>>).props;
    expect(props.dashboardUrl).toBe('https://test.app/dashboard');
    expect(props.carteUrl).toBe('https://test.app');
    expect(props.firstName).toBe('Marie');
    expect((react as React.ReactElement).type).toBe(BienvenueAmbassadeur);
  });
});

describe('sendAcceptationVisite', () => {
  it('envoie au visiteur avec le bon composant et les props hôte', async () => {
    await sendAcceptationVisite(
      'visitor@test.fr', 'Sophie', 'Marie', '12 rue de la Paix, Paris', null,
      'Nuit de Prière', '2026-06-14', 'https://test.app/contact',
    );
    const { to, react } = lastCallPayload();
    const props = (react as React.ReactElement<Record<string, unknown>>).props;
    expect(to).toBe('visitor@test.fr');
    expect(props.visitorFirstName).toBe('Sophie');
    expect(props.hostFirstName).toBe('Marie');
    expect(props.hostAddress).toBe('12 rue de la Paix, Paris');
    expect(props.hostPhone).toBeNull();
    expect((react as React.ReactElement).type).toBe(ContactAccepted);
  });
});

describe('sendCampagneAmbassadeurs', () => {
  it('passe customMessage quand fourni', async () => {
    await sendCampagneAmbassadeurs('amb@test.fr', 'Jean', 'Live Guérison', '2026-06-14', 'https://activate.url', 'Message perso');
    const { react } = lastCallPayload();
    expect((react as React.ReactElement<Record<string, unknown>>).props.customMessage).toBe('Message perso');
    expect((react as React.ReactElement).type).toBe(CampagneAmbassadeurs);
  });

  it('customMessage optionnel — undefined si non fourni', async () => {
    await sendCampagneAmbassadeurs('amb@test.fr', 'Jean', 'Live Guérison', '2026-06-14', 'https://activate.url');
    const { react } = lastCallPayload();
    expect((react as React.ReactElement<Record<string, unknown>>).props.customMessage).toBeUndefined();
  });
});

describe('sendAdminAlertNoActivations', () => {
  it('envoie à RESEND_ADMIN_EMAIL avec le bon composant', async () => {
    await sendAdminAlertNoActivations('Live Guérison', '2026-06-14');
    const { to, react } = lastCallPayload();
    expect(to).toBe('admin@test.fr');
    expect((react as React.ReactElement).type).toBe(AdminAlerteNoActivations);
    expect((react as React.ReactElement<Record<string, unknown>>).props.eventTitle).toBe('Live Guérison');
    expect((react as React.ReactElement<Record<string, unknown>>).props.adminUrl).toBe('https://test.app/admin/stats');
  });
});

describe('sendContactRequestReserved', () => {
  it('passe hostWhatsappGroupUrl null sans erreur', async () => {
    const availableAt = new Date('2026-06-14T18:00:00Z');
    await sendContactRequestReserved(
      'visitor@test.fr', 'Lucas', 'Marie', 'Paris',
      'marie@test.fr', null, 'https://test.app/accueil', availableAt,
    );
    const { react } = lastCallPayload();
    expect((react as React.ReactElement<Record<string, unknown>>).props.hostWhatsappGroupUrl).toBeNull();
    expect((react as React.ReactElement).type).toBe(ContactReserved);
  });
});
