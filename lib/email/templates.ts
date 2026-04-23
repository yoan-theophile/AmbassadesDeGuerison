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
// RESEND_TEMPLATE_CONTACT_RESERVED
//   variables : visitor_first_name, host_first_name, host_city, host_email, host_whatsapp_group_url, accueil_url, available_at
//
// RESEND_TEMPLATE_CONTACT_RECEIVED_HOST
//   variables : host_first_name, visitor_first_name, visitor_email, visitor_whatsapp, visitor_message, decline_url
//
// RESEND_TEMPLATE_CONTACT_DECLINED
//   variables : visitor_first_name, host_first_name, app_url
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

export async function sendContactRequestReserved(
  to: string,
  visitorFirstName: string,
  hostFirstName: string,
  hostCity: string,
  hostEmail: string,
  hostWhatsappGroupUrl: string | null,
  accueilUrl: string,
  availableAt: Date
) {
  const dateStr = availableAt.toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  const whatsappLine = hostWhatsappGroupUrl
    ? `<p>💬 Groupe WhatsApp de l'ambassade : <a href="${hostWhatsappGroupUrl}">Rejoindre le groupe</a></p>`
    : '';
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Votre place est réservée — Ambassade de ${hostFirstName}`,
    ...templateOrHtml('RESEND_TEMPLATE_CONTACT_RESERVED', {
      visitor_first_name: visitorFirstName,
      host_first_name: hostFirstName,
      host_city: hostCity,
      host_email: hostEmail,
      host_whatsapp_group_url: hostWhatsappGroupUrl ?? '',
      accueil_url: accueilUrl,
      available_at: dateStr,
    }, `
      <p>Bonjour ${visitorFirstName},</p>
      <p>Votre demande pour rejoindre l'ambassade de <strong>${hostFirstName}</strong> (${hostCity}) est bien enregistrée.</p>
      <p>Pour contacter directement l'ambassadeur :</p>
      <p>✉️ E-mail : <a href="mailto:${hostEmail}">${hostEmail}</a></p>
      ${whatsappLine}
      <p style="margin-top:16px;">Votre lien d'accès à l'adresse sera disponible le <strong>${dateStr}</strong>.</p>
      <p><a href="${accueilUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Accéder à mon lien</a></p>
      <p style="color:#64748b;font-size:13px;">Si vous ne pouvez finalement pas venir, vous n'avez rien à faire — votre place sera libérée automatiquement.</p>
      <p style="color:#64748b;font-size:13px;">Ambassades de Guérison — <a href="${APP_URL()}">Voir la carte</a></p>
    `),
  } as any);
}

export async function sendContactRequestDeclined(
  to: string,
  visitorFirstName: string,
  hostFirstName: string
) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Votre demande auprès de ${hostFirstName} n'a pas pu être confirmée`,
    ...templateOrHtml('RESEND_TEMPLATE_CONTACT_DECLINED', {
      visitor_first_name: visitorFirstName,
      host_first_name: hostFirstName,
      app_url: APP_URL(),
    }, `
      <p>Bonjour ${visitorFirstName},</p>
      <p>${hostFirstName} n'est malheureusement pas en mesure de vous accueillir pour ce live.</p>
      <p>D'autres ambassades sont peut-être disponibles près de chez vous :</p>
      <p><a href="${APP_URL()}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Voir la carte</a></p>
    `),
  } as any);
}

export async function sendNewContactRequestHost(
  to: string,
  hostFirstName: string,
  visitorFirstName: string,
  visitorEmail: string,
  visitorWhatsapp: string | null,
  visitorMessage: string | null,
  declineUrl: string
) {
  const contactLine = visitorWhatsapp
    ? `<p>📱 WhatsApp : <a href="https://wa.me/${visitorWhatsapp.replace(/\D/g, '')}">${visitorWhatsapp}</a></p>`
    : '';
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `${visitorFirstName} souhaite rejoindre votre ambassade`,
    ...templateOrHtml('RESEND_TEMPLATE_CONTACT_RECEIVED_HOST', {
      host_first_name: hostFirstName,
      visitor_first_name: visitorFirstName,
      visitor_email: visitorEmail,
      visitor_whatsapp: visitorWhatsapp ?? '',
      visitor_message: visitorMessage ?? '',
      decline_url: declineUrl,
    }, `
      <p>Bonjour ${hostFirstName},</p>
      <p><strong>${visitorFirstName}</strong> souhaite rejoindre votre ambassade.</p>
      <p>✉️ E-mail : <a href="mailto:${visitorEmail}">${visitorEmail}</a></p>
      ${contactLine}
      ${visitorMessage ? `<p>Message : <em>"${visitorMessage}"</em></p>` : ''}
      <p style="color:#64748b;font-size:13px;margin-top:16px;">Sa place sera confirmée automatiquement dans 24 heures. Si vous n'êtes pas en mesure de l'accueillir, cliquez ici :</p>
      <p><a href="${declineUrl}" style="background:#ef4444;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Refuser cette demande</a></p>
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
