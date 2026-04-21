import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.RESEND_FROM_EMAIL!;
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL!;

/**
 * Construit le payload e-mail : template Resend si l'env var est définie,
 * sinon fallback sur le HTML hardcodé.
 *
 * Pour activer un template :
 * 1. Créer le template dans le dashboard Resend (resend.com/emails/templates)
 * 2. Ajouter l'ID dans .env.local : RESEND_TEMPLATE_<NOM>=<uuid>
 * 3. Les variables {{variable}} dans le template seront remplacées par `variables`.
 */
function templateOrHtml(
  envKey: string,
  variables: Record<string, string>,
  html: string
): { html: string } | { template: { id: string; variables: Record<string, string> } } {
  const id = process.env[envKey];
  if (id) return { template: { id, variables } };
  return { html };
}

// ---------------------------------------------------------------------------
// Templates disponibles — IDs à renseigner dans .env.local après création
// dans le dashboard Resend. Tant qu'un env var est absent, le HTML ci-dessous
// est utilisé en fallback.
//
// RESEND_TEMPLATE_MAGIC_LINK
//   variables : magic_link_url
//
// RESEND_TEMPLATE_SIGNAL_APPROVED
//   variables : first_name, live_link
//
// RESEND_TEMPLATE_REGISTRATION
//   variables : first_name, dashboard_url
//
// RESEND_TEMPLATE_CONTACT_ACCEPTED
//   variables : host_first_name, action_url
//
// RESEND_TEMPLATE_CONTACT_RECEIVED_VISITOR
//   variables : visitor_first_name, host_first_name, host_city, contact_hint, app_url
//
// RESEND_TEMPLATE_CONTACT_RECEIVED_HOST
//   variables : host_first_name, visitor_first_name, visitor_email, visitor_message, dashboard_url
//
// RESEND_TEMPLATE_ADMIN_NO_ACTIVATIONS
//   variables : event_title, event_date, admin_url
// ---------------------------------------------------------------------------

export async function sendMagicLink(to: string, magicLinkUrl: string) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Votre lien de connexion — Ambassades de Guérison',
    ...templateOrHtml('RESEND_TEMPLATE_MAGIC_LINK', { magic_link_url: magicLinkUrl }, `
      <p>Bonjour,</p>
      <p>Cliquez sur le lien ci-dessous pour vous connecter à votre espace ambassadeur :</p>
      <p><a href="${magicLinkUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Me connecter</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
    `),
  } as any);
}

export async function sendSignalApproved(to: string, firstName: string, liveLink: string) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: '🎉 Vous avez été sélectionné pour témoigner en direct !',
    ...templateOrHtml('RESEND_TEMPLATE_SIGNAL_APPROVED', { first_name: firstName, live_link: liveLink }, `
      <p>Bonjour ${firstName},</p>
      <p>David a approuvé votre signal. Vous êtes invité à témoigner en direct !</p>
      <p>Rejoignez le live maintenant :</p>
      <p><a href="${liveLink}" style="background:#16A34A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Rejoindre le live</a></p>
      <p>Préparez-vous à partager votre témoignage en quelques mots.</p>
    `),
  } as any);
}

export async function sendRegistrationConfirmation(to: string, firstName: string) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Bienvenue parmi les Ambassadeurs de Guérison !',
    ...templateOrHtml('RESEND_TEMPLATE_REGISTRATION', {
      first_name: firstName,
      dashboard_url: `${APP_URL()}/dashboard`,
    }, `
      <p>Bonjour ${firstName},</p>
      <p>Votre inscription est confirmée. Vous faites maintenant partie du réseau des Ambassades de Guérison.</p>
      <p>Votre ambassade apparaîtra sur la carte lors du prochain live de David Thery.</p>
      <p><a href="${APP_URL()}/dashboard" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Accéder à mon espace</a></p>
    `),
  } as any);
}

export async function sendContactRequestAccepted(
  to: string,
  hostFirstName: string,
  actionToken: string
) {
  const actionUrl = `${APP_URL()}/accueil-invite/${actionToken}`;
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `🎉 Votre demande a été acceptée par ${hostFirstName}`,
    ...templateOrHtml('RESEND_TEMPLATE_CONTACT_ACCEPTED', {
      host_first_name: hostFirstName,
      action_url: actionUrl,
    }, `
      <p>Bonjour,</p>
      <p>Bonne nouvelle ! ${hostFirstName} a accepté votre demande de contact.</p>
      <p>Avant de vous rendre à l'ambassade, veuillez lire les consignes :</p>
      <p><a href="${actionUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Voir les consignes et l'adresse</a></p>
      <p>Ce lien est valable 7 jours.</p>
    `),
  } as any);
}

export async function sendContactRequestReceivedVisitor(
  to: string,
  visitorFirstName: string,
  hostFirstName: string,
  hostCity: string,
  contactMode: string
) {
  const contactHint: Record<string, string> = {
    email: 'par e-mail',
    whatsapp: 'via WhatsApp',
    telephone: 'par téléphone',
  };
  const hint = contactHint[contactMode] ?? 'prochainement';
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Demande envoyée à l'ambassade de ${hostFirstName}`,
    ...templateOrHtml('RESEND_TEMPLATE_CONTACT_RECEIVED_VISITOR', {
      visitor_first_name: visitorFirstName,
      host_first_name: hostFirstName,
      host_city: hostCity,
      contact_hint: hint,
      app_url: APP_URL(),
    }, `
      <p>Bonjour ${visitorFirstName},</p>
      <p>Votre demande de contact à l'ambassade de <strong>${hostFirstName}</strong> (${hostCity}) a bien été reçue.</p>
      <p>${hostFirstName} vous contactera <strong>${hint}</strong>, généralement dans les 24 à 48 heures.</p>
      <p>Si vous n'avez pas de nouvelles passé ce délai, vous pouvez soumettre une nouvelle demande depuis la carte.</p>
      <p style="color:#64748b;font-size:13px;">Ambassades de Guérison — <a href="${APP_URL()}">Voir la carte</a></p>
    `),
  } as any);
}

export async function sendNewContactRequestHost(
  to: string,
  hostFirstName: string,
  visitorFirstName: string,
  visitorEmail: string,
  visitorMessage: string | null
) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Nouvelle demande de ${visitorFirstName}`,
    ...templateOrHtml('RESEND_TEMPLATE_CONTACT_RECEIVED_HOST', {
      host_first_name: hostFirstName,
      visitor_first_name: visitorFirstName,
      visitor_email: visitorEmail,
      visitor_message: visitorMessage ?? '',
      dashboard_url: `${APP_URL()}/dashboard`,
    }, `
      <p>Bonjour ${hostFirstName},</p>
      <p><strong>${visitorFirstName}</strong> (${visitorEmail}) souhaite rejoindre votre ambassade.</p>
      ${visitorMessage ? `<p>Message : <em>"${visitorMessage}"</em></p>` : ''}
      <p>Connectez-vous à votre espace pour accepter ou refuser cette demande :</p>
      <p><a href="${APP_URL()}/dashboard" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Voir la demande</a></p>
    `),
  } as any);
}

export async function sendAdminAlertNoActivations(eventTitle: string, eventDate: string) {
  const adminEmail = process.env.RESEND_ADMIN_EMAIL!;
  return getResend().emails.send({
    from: FROM(),
    to: adminEmail,
    subject: `⚠️ Alerte : 0 hôtes actifs pour "${eventTitle}"`,
    ...templateOrHtml('RESEND_TEMPLATE_ADMIN_NO_ACTIVATIONS', {
      event_title: eventTitle,
      event_date: eventDate,
      admin_url: `${APP_URL()}/admin/stats`,
    }, `
      <p>Attention : l'événement <strong>${eventTitle}</strong> (${eventDate}) n'a aucun hôte actif dans host_activations.</p>
      <p>Le trigger fn_auto_activate_hosts_for_event a peut-être échoué silencieusement.</p>
      <p><a href="${APP_URL()}/admin/stats">Vérifier dans l'admin</a></p>
    `),
  } as any);
}
