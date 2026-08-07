import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';

// Régression corrigée par commits e2db840/2d6641f : lib/email/send.ts avalait les
// erreurs d'envoi silencieusement (Resend result.error jamais vérifié ; Mailhog
// sendMail() dont l'exception se propageait mais sans log). getMailer().emails.send()
// doit désormais :
//   1. logger + rethrow si Resend renvoie { error } (pas d'exception réseau, juste un
//      champ error dans la réponse 200 — cas fréquent avec Resend)
//   2. logger + rethrow si Mailhog sendMail() rejette (ex: ECONNREFUSED)
// Sans ce fix, POST /api/inscriptions (et toute autre route qui fait
// .catch(() => {})) perdait silencieusement toute trace d'un échec d'envoi.

const { mockResendSend, mockSendMail, mockCreateTransport } = vi.hoisted(() => {
  const mockResendSend = vi.fn();
  const mockSendMail = vi.fn();
  const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));
  return { mockResendSend, mockSendMail, mockCreateTransport };
});

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockResendSend };
  },
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
}));

vi.mock('@react-email/render', () => ({
  render: vi.fn().mockResolvedValue('<p>html</p>'),
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  mockResendSend.mockReset();
  mockSendMail.mockReset();
  mockCreateTransport.mockClear();
  process.env.RESEND_API_KEY = 'test-key';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('getMailer — erreurs Resend ne sont plus avalées', () => {
  it('Resend renvoie { error } (200 mais échec applicatif) → throw + log', async () => {
    delete process.env.USE_MAILHOG;
    mockResendSend.mockResolvedValue({ data: null, error: { message: 'Invalid recipient' } });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getMailer } = await import('@/lib/email/send');

    await expect(
      getMailer().emails.send({
        from: 'noreply@test.fr',
        to: 'bad@test.fr',
        subject: 'Sujet',
        react: React.createElement('p', null, 'contenu'),
      })
    ).rejects.toThrow('Invalid recipient');

    expect(errSpy).toHaveBeenCalled();
  });

  it('Resend succès (pas de error) → ne throw pas, retourne le résultat', async () => {
    delete process.env.USE_MAILHOG;
    mockResendSend.mockResolvedValue({ data: { id: 'ok-id' }, error: null });
    const { getMailer } = await import('@/lib/email/send');

    const result = await getMailer().emails.send({
      from: 'noreply@test.fr',
      to: 'ok@test.fr',
      subject: 'Sujet',
      react: React.createElement('p', null, 'contenu'),
    });

    expect(result).toEqual({ data: { id: 'ok-id' }, error: null });
  });
});

describe('getMailer — erreurs Mailhog ne sont plus avalées', () => {
  it('sendMail() Mailhog rejette (ex: ECONNREFUSED) → throw + log, propage vers l\'appelant', async () => {
    process.env.USE_MAILHOG = 'true';
    const smtpError = new Error('Unexpected socket close');
    mockSendMail.mockRejectedValue(smtpError);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getMailer } = await import('@/lib/email/send');

    await expect(
      getMailer().emails.send({
        from: 'noreply@test.fr',
        to: 'dest@test.fr',
        subject: 'Sujet',
        react: React.createElement('p', null, 'contenu'),
      })
    ).rejects.toThrow('Unexpected socket close');

    expect(errSpy).toHaveBeenCalled();
  });

  it('un nouveau transport Mailhog est créé à chaque envoi (pas de singleton partagé)', async () => {
    process.env.USE_MAILHOG = 'true';
    mockSendMail.mockResolvedValue({ messageId: '1' });
    const { getMailer } = await import('@/lib/email/send');
    const mailer = getMailer();

    await mailer.emails.send({ from: 'a@test.fr', to: 'b@test.fr', subject: 'S1', react: React.createElement('p') });
    await mailer.emails.send({ from: 'a@test.fr', to: 'c@test.fr', subject: 'S2', react: React.createElement('p') });

    // Avant le fix (transport singleton mémoïsé), createTransport n'était appelé
    // qu'une fois pour toute la durée de vie du process. Le fix recrée un transport
    // par envoi comme filet de sécurité contre une connexion keep-alive fermée côté
    // serveur (cause du bug Mailhog IPv4/IPv6 documenté en connaissance-transfert).
    expect(mockCreateTransport).toHaveBeenCalledTimes(2);
  });
});
