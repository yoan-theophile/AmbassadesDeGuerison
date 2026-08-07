import { Resend } from 'resend';
import nodemailer from 'nodemailer';
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

// Un nouveau transport par envoi : un transport nodemailer partagé entre appels
// gardait une connexion SMTP keep-alive vers Mailhog qui pouvait déjà être fermée
// côté serveur, provoquant un "Unexpected socket close" silencieux sur le 2e envoi
// d'une séquence rapprochée (ex: confirmation candidat + notification admin).
function getMailhogTransport() {
  return nodemailer.createTransport({
    host: process.env.MAILHOG_SMTP_HOST || 'localhost',
    port: Number(process.env.MAILHOG_SMTP_PORT || 1025),
    ignoreTLS: true,
  });
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
          try {
            return await getMailhogTransport().sendMail({ from, to, subject, html });
          } catch (err) {
            console.error(`[email] Échec envoi Mailhog vers ${to} ("${subject}"):`, err);
            throw err;
          }
        }
        const result = await getResendClient().emails.send({ from, to, subject, react });
        if (result.error) {
          console.error(`[email] Échec envoi Resend vers ${to} ("${subject}"):`, result.error);
          throw new Error(result.error.message);
        }
        return result;
      },
    },
  };
}
