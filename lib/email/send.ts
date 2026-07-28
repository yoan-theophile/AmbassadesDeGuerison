import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';
import { render } from '@react-email/render';
import type * as React from 'react';

interface MailPayload {
  from: string;
  to: string;
  subject: string;
  react: React.ReactElement;
}

function useMailhog() {
  return process.env.USE_MAILHOG === 'true';
}

let mailhogTransport: Transporter | null = null;

function getMailhogTransport() {
  if (!mailhogTransport) {
    mailhogTransport = nodemailer.createTransport({
      host: process.env.MAILHOG_SMTP_HOST || 'localhost',
      port: Number(process.env.MAILHOG_SMTP_PORT || 1025),
      ignoreTLS: true,
    });
  }
  return mailhogTransport;
}

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Point d'entrée unique pour l'envoi d'e-mails. Route vers Mailhog (SMTP local, capturé
 * dans son dashboard web) quand USE_MAILHOG=true, sinon vers Resend (API HTTP réelle).
 * Même signature que `new Resend().emails.send(...)` pour ne rien changer dans templates.ts.
 */
export function getMailer() {
  return {
    emails: {
      async send({ from, to, subject, react }: MailPayload) {
        if (useMailhog()) {
          const html = await render(react);
          return getMailhogTransport().sendMail({ from, to, subject, html });
        }
        return getResendClient().emails.send({ from, to, subject, react });
      },
    },
  };
}
