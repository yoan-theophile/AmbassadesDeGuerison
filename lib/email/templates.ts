import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.RESEND_FROM_EMAIL!;
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL!;

export async function sendMagicLink(to: string, magicLinkUrl: string) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Votre lien de connexion — Ambassades de Guérison',
    html: `
      <p>Bonjour,</p>
      <p>Cliquez sur le lien ci-dessous pour vous connecter à votre espace ambassadeur :</p>
      <p><a href="${magicLinkUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Me connecter</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
    `,
  });
}

export async function sendSignalApproved(to: string, firstName: string, liveLink: string) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: '🎉 Vous avez été sélectionné pour témoigner en direct !',
    html: `
      <p>Bonjour ${firstName},</p>
      <p>David a approuvé votre signal. Vous êtes invité à témoigner en direct !</p>
      <p>Rejoignez le live maintenant :</p>
      <p><a href="${liveLink}" style="background:#16A34A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Rejoindre le live</a></p>
      <p>Préparez-vous à partager votre témoignage en quelques mots.</p>
    `,
  });
}

export async function sendRegistrationConfirmation(to: string, firstName: string) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Bienvenue parmi les Ambassadeurs de Guérison !',
    html: `
      <p>Bonjour ${firstName},</p>
      <p>Votre inscription est confirmée. Vous faites maintenant partie du réseau des Ambassades de Guérison.</p>
      <p>Votre ambassade apparaîtra sur la carte lors du prochain live de David Thery.</p>
      <p><a href="${APP_URL()}/dashboard" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Accéder à mon espace</a></p>
    `,
  });
}

export async function sendContactRequestAccepted(
  to: string,
  hostFirstName: string,
  actionToken: string
) {
  const url = `${APP_URL()}/accueil-invite/${actionToken}`;
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `🎉 Votre demande a été acceptée par ${hostFirstName}`,
    html: `
      <p>Bonjour,</p>
      <p>Bonne nouvelle ! ${hostFirstName} a accepté votre demande de contact.</p>
      <p>Avant de vous rendre à l'ambassade, veuillez lire les consignes :</p>
      <p><a href="${url}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Voir les consignes et l'adresse</a></p>
      <p>Ce lien est valable 7 jours.</p>
    `,
  });
}

export async function sendAdminAlertNoActivations(eventTitle: string, eventDate: string) {
  const adminEmail = process.env.RESEND_ADMIN_EMAIL!;
  return getResend().emails.send({
    from: FROM(),
    to: adminEmail,
    subject: `⚠️ Alerte : 0 hôtes actifs pour "${eventTitle}"`,
    html: `
      <p>Attention : l'événement <strong>${eventTitle}</strong> (${eventDate}) n'a aucun hôte actif dans host_activations.</p>
      <p>Le trigger fn_auto_activate_hosts_for_event a peut-être échoué silencieusement.</p>
      <p><a href="${APP_URL()}/admin/stats">Vérifier dans l'admin</a></p>
    `,
  });
}
