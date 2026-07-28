import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';

const { mockResendSend, mockSendMail, mockCreateTransport } = vi.hoisted(() => {
  const mockResendSend = vi.fn().mockResolvedValue({ data: { id: 'resend-id' }, error: null });
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'mailhog-id' });
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
  mockResendSend.mockClear();
  mockSendMail.mockClear();
  mockCreateTransport.mockClear();
  process.env.RESEND_API_KEY = 'test-key';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe('getMailer routing', () => {
  it('envoie via Resend quand USE_MAILHOG est absent', async () => {
    delete process.env.USE_MAILHOG;
    const { getMailer } = await import('@/lib/email/send');

    await getMailer().emails.send({
      from: 'noreply@test.fr',
      to: 'dest@test.fr',
      subject: 'Sujet',
      react: React.createElement('p', null, 'contenu'),
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('envoie via Mailhog quand USE_MAILHOG=true', async () => {
    process.env.USE_MAILHOG = 'true';
    const { getMailer } = await import('@/lib/email/send');

    await getMailer().emails.send({
      from: 'noreply@test.fr',
      to: 'dest@test.fr',
      subject: 'Sujet',
      react: React.createElement('p', null, 'contenu'),
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'dest@test.fr', subject: 'Sujet', html: '<p>html</p>' }),
    );
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('utilise MAILHOG_SMTP_HOST/PORT si fournis', async () => {
    process.env.USE_MAILHOG = 'true';
    process.env.MAILHOG_SMTP_HOST = 'mailhog-test-host';
    process.env.MAILHOG_SMTP_PORT = '2025';
    const { getMailer } = await import('@/lib/email/send');

    await getMailer().emails.send({
      from: 'noreply@test.fr',
      to: 'dest@test.fr',
      subject: 'Sujet',
      react: React.createElement('p', null, 'contenu'),
    });

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'mailhog-test-host', port: 2025 }),
    );
  });
});
