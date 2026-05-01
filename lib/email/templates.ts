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
//
// RESEND_TEMPLATE_NOUVELLE_ACTIVATION_ADMIN
//   variables : first_name, city, country, admin_url
//
// RESEND_TEMPLATE_BIENVENUE_AMBASSADEUR
//   variables : first_name, dashboard_url, carte_url
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

export async function sendNouvelleActivationAdmin(firstName: string, city: string, country: string) {
  const adminEmail = process.env.RESEND_ADMIN_EMAIL!;
  return getResend().emails.send({
    from: FROM(),
    to: adminEmail,
    subject: `Nouvelle ambassade activée — ${firstName}, ${city}`,
    ...templateOrHtml('RESEND_TEMPLATE_NOUVELLE_ACTIVATION_ADMIN', {
      first_name: firstName,
      city,
      country,
      admin_url: `${APP_URL()}/admin/ambassadeurs`,
    }, `
      <p>Une nouvelle ambassade vient d'être activée :</p>
      <ul>
        <li><strong>Prénom :</strong> ${firstName}</li>
        <li><strong>Ville :</strong> ${city}</li>
        <li><strong>Pays :</strong> ${country}</li>
      </ul>
      <p><a href="${APP_URL()}/admin/ambassadeurs">Voir les ambassadeurs</a></p>
    `),
  } as any);
}

export async function sendBienvenueAmbassadeur(to: string, firstName: string) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Bienvenue dans les Ambassades de Guérison !',
    ...templateOrHtml('RESEND_TEMPLATE_BIENVENUE_AMBASSADEUR', {
      first_name: firstName,
      dashboard_url: `${APP_URL()}/dashboard`,
      carte_url: `${APP_URL()}`,
    }, `
      <p>Bonjour ${firstName},</p>
      <p>Votre ambassade est maintenant active ! Vous apparaissez sur la carte des Ambassades de Guérison.</p>
      <p>Lors des prochains lives de David Théry, vous pourrez accueillir des participants chez vous.</p>
      <p><a href="${APP_URL()}/dashboard" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Accéder à mon espace</a></p>
      <p style="margin-top:16px;"><a href="${APP_URL()}">Voir ma position sur la carte</a></p>
    `),
  } as any);
}

// ── NOUVEAUX TEMPLATES (pivot live-driven v2) ──────────────────────────────
//
// RESEND_TEMPLATE_MAGIC_LINK_AMBASSADEUR_BIENVENUE
//   variables : magic_link_url, first_name
//
// RESEND_TEMPLATE_PRE_VALIDATION_ACCORDEE
//   variables : first_name, video_url, pdf_url, dashboard_url
//
// RESEND_TEMPLATE_VALIDATION_FINALE
//   variables : first_name, dashboard_url, carte_url
//
// RESEND_TEMPLATE_CAMPAIGN_AMBASSADORS
//   variables : first_name, event_title, event_date, activate_url, custom_message
//
// RESEND_TEMPLATE_CAMPAIGN_VISITORS
//   variables : first_name, event_title, event_date, carte_url, unsubscribe_url
//
// RESEND_TEMPLATE_ACCEPTATION_VISITEUR
//   variables : visitor_first_name, host_first_name, host_address, host_phone, event_title, event_date, contact_url
//
// RESEND_TEMPLATE_REFUS_VISITEUR
//   variables : visitor_first_name, host_first_name, carte_url
//
// RESEND_TEMPLATE_FEEDBACK_POST_LIVE
//   variables : first_name, event_title, feedback_url

export async function sendMagicLinkAmbassadeurBienvenue(
  to: string,
  firstName: string,
  magicLinkUrl: string
) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Votre lien de connexion — Ambassades de Guérison',
    ...templateOrHtml('RESEND_TEMPLATE_MAGIC_LINK_AMBASSADEUR_BIENVENUE', {
      magic_link_url: magicLinkUrl,
      first_name: firstName,
    }, `
      <p>Bonjour ${firstName},</p>
      <p>Merci de vouloir ouvrir votre maison pour les lives de guérison de David Théry.</p>
      <p>Cliquez sur le lien ci-dessous pour accéder à votre espace et finaliser votre inscription :</p>
      <p><a href="${magicLinkUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Accéder à mon espace</a></p>
      <p style="color:#64748b;font-size:13px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>
    `),
  } as any);
}

export async function sendPreValidationAccordee(
  to: string,
  firstName: string,
  videoUrl: string,
  pdfUrl: string
) {
  const dashboardUrl = `${APP_URL()}/dashboard`;
  const questionnaireUrl = `${APP_URL()}/dashboard/questionnaire`;
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Bonne nouvelle — votre candidature ambassadeur est pré-approuvée !',
    ...templateOrHtml('RESEND_TEMPLATE_PRE_VALIDATION_ACCORDEE', {
      first_name: firstName,
      video_url: videoUrl,
      pdf_url: pdfUrl,
      dashboard_url: dashboardUrl,
      questionnaire_url: questionnaireUrl,
    }, `
      <p>Bonjour ${firstName},</p>
      <p>Bonne nouvelle ! Votre candidature pour devenir ambassadeur de guérison a été pré-approuvée. Merci pour votre disponibilité à ouvrir votre maison.</p>
      <p>Avant la validation finale, il reste une dernière étape : compléter votre profil enrichi. Cela prend moins de 5 minutes.</p>
      <p><a href="${questionnaireUrl}" style="background:#4F46E5;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-size:16px;">Compléter mon profil →</a></p>
      <p style="margin-top:16px;">Vous pouvez aussi :</p>
      <p>
        <a href="${videoUrl}" style="color:#4F46E5;">Voir la vidéo de formation</a> ·
        <a href="${pdfUrl}" style="color:#4F46E5;">Lire la charte ambassadeur</a>
      </p>
      <p style="color:#64748b;font-size:13px;margin-top:16px;">Si vous avez des questions, répondez directement à cet e-mail.</p>
    `),
  } as any);
}

export async function sendEnrichissementRecu(adminEmail: string, ambassadeurFirstName: string) {
  return getResend().emails.send({
    from: FROM(),
    to: adminEmail,
    subject: `Questionnaire soumis — ${ambassadeurFirstName} attend sa validation finale`,
    html: `
      <p>L'ambassadeur <strong>${ambassadeurFirstName}</strong> vient de soumettre son questionnaire d'enrichissement.</p>
      <p>Son statut est maintenant <code>enrichment_pending</code>. Il attend votre validation finale.</p>
      <p><a href="${APP_URL()}/admin/ambassadeurs">Valider dans l'admin →</a></p>
    `,
  } as any);
}

export async function sendValidationFinale(to: string, firstName: string) {
  const dashboardUrl = `${APP_URL()}/dashboard`;
  const carteUrl = APP_URL();
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Bienvenue dans la famille des Ambassades de Guérison, ${firstName} !`,
    ...templateOrHtml('RESEND_TEMPLATE_VALIDATION_FINALE', {
      first_name: firstName,
      dashboard_url: dashboardUrl,
      carte_url: carteUrl,
    }, `
      <p>Bonjour ${firstName},</p>
      <p>C'est officiel — votre ambassade est validée. Vous faites maintenant partie du réseau mondial des Ambassades de Guérison.</p>
      <p>Lors du prochain live de David Théry, vous recevrez un e-mail pour confirmer que vous ouvrez votre maison. Un simple clic suffira.</p>
      <p>D'ici là, vous pouvez consulter votre espace ambassadeur et suivre les demandes de visite :</p>
      <p><a href="${dashboardUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Mon espace ambassadeur</a></p>
      <p style="margin-top:16px;"><a href="${carteUrl}">Voir ma position sur la carte</a></p>
      <p style="color:#64748b;font-size:13px;margin-top:16px;">Merci d'ouvrir votre maison. C'est là que tout se passe.</p>
    `),
  } as any);
}

export async function sendCampagneAmbassadeurs(
  to: string,
  firstName: string,
  eventTitle: string,
  eventDate: string,
  activateUrl: string,
  customMessage?: string
) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Le prochain live approche — allez-vous ouvrir votre ambassade ?`,
    ...templateOrHtml('RESEND_TEMPLATE_CAMPAIGN_AMBASSADORS', {
      first_name: firstName,
      event_title: eventTitle,
      event_date: eventDate,
      activate_url: activateUrl,
      custom_message: customMessage ?? '',
    }, `
      <p>Bonjour ${firstName},</p>
      ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
      <p>Le prochain live de David Théry — <strong>${eventTitle}</strong> — a lieu le <strong>${eventDate}</strong>.</p>
      <p>Allez-vous ouvrir votre ambassade pour accueillir des visiteurs ce soir-là ?</p>
      <p><a href="${activateUrl}" style="background:#4F46E5;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-size:16px;">Oui, j'ouvre mon ambassade</a></p>
      <p style="color:#64748b;font-size:13px;margin-top:16px;">Vous pouvez aussi préciser le nombre de places disponibles depuis votre espace ambassadeur.</p>
      <p style="color:#64748b;font-size:13px;">Si vous ne pouvez pas cette fois, pas de problème — votre ambassade restera inactive pour ce live uniquement.</p>
    `),
  } as any);
}

export async function sendCampagneVisiteurs(
  to: string,
  firstName: string,
  eventTitle: string,
  eventDate: string,
  unsubscribeUrl: string
) {
  const carteUrl = APP_URL();
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Un nouveau live de guérison arrive — rejoignez une ambassade près de chez vous`,
    ...templateOrHtml('RESEND_TEMPLATE_CAMPAIGN_VISITORS', {
      first_name: firstName,
      event_title: eventTitle,
      event_date: eventDate,
      carte_url: carteUrl,
      unsubscribe_url: unsubscribeUrl,
    }, `
      <p>Bonjour ${firstName},</p>
      <p>David Théry anime un nouveau live de guérison : <strong>${eventTitle}</strong>, le <strong>${eventDate}</strong>.</p>
      <p>Des ambassades sont prêtes à vous accueillir partout dans le monde — chez des particuliers ou dans des petites églises — pour vivre ce live ensemble.</p>
      <p><a href="${carteUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Trouver une ambassade près de moi</a></p>
      <p style="color:#64748b;font-size:13px;margin-top:24px;">Vous recevez cet e-mail parce que vous avez déjà participé à un live.<br>
      <a href="${unsubscribeUrl}" style="color:#94a3b8;">Ne plus recevoir ces e-mails</a></p>
    `),
  } as any);
}

export async function sendAcceptationVisite(
  to: string,
  visitorFirstName: string,
  hostFirstName: string,
  hostAddress: string,
  hostPhone: string | null,
  eventTitle: string,
  eventDate: string,
  contactEquipeUrl: string
) {
  const phoneLine = hostPhone
    ? `<p>📞 Téléphone de ${hostFirstName} : <strong>${hostPhone}</strong></p>`
    : '';
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `${hostFirstName} vous accueille — voici l'adresse`,
    ...templateOrHtml('RESEND_TEMPLATE_ACCEPTATION_VISITEUR', {
      visitor_first_name: visitorFirstName,
      host_first_name: hostFirstName,
      host_address: hostAddress,
      host_phone: hostPhone ?? '',
      event_title: eventTitle,
      event_date: eventDate,
      contact_url: contactEquipeUrl,
    }, `
      <p>Bonjour ${visitorFirstName},</p>
      <p>Bonne nouvelle — <strong>${hostFirstName}</strong> vous accueille pour le live <strong>${eventTitle}</strong> du <strong>${eventDate}</strong>.</p>
      <p style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:4px;">
        <strong>📍 Adresse :</strong> ${hostAddress}
      </p>
      ${phoneLine}
      <p>Présentez-vous quelques minutes avant le début du live. Si vous avez un empêchement, pas besoin de prévenir — votre place sera libérée automatiquement.</p>
      <p style="color:#64748b;font-size:13px;margin-top:16px;">Un souci ? <a href="${contactEquipeUrl}">Contactez l'équipe</a></p>
    `),
  } as any);
}

export async function sendRefusVisite(
  to: string,
  visitorFirstName: string,
  hostFirstName: string
) {
  const carteUrl = APP_URL();
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Votre demande auprès de ${hostFirstName} — mise à jour`,
    ...templateOrHtml('RESEND_TEMPLATE_REFUS_VISITEUR', {
      visitor_first_name: visitorFirstName,
      host_first_name: hostFirstName,
      carte_url: carteUrl,
    }, `
      <p>Bonjour ${visitorFirstName},</p>
      <p>${hostFirstName} n'est malheureusement pas en mesure de vous accueillir pour ce live.</p>
      <p>D'autres ambassades sont peut-être disponibles près de chez vous :</p>
      <p><a href="${carteUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Voir la carte</a></p>
      <p style="color:#64748b;font-size:13px;margin-top:16px;">Ne vous découragez pas — les ambassades grandissent à chaque live.</p>
    `),
  } as any);
}

export async function sendFeedbackPostLive(
  to: string,
  firstName: string,
  eventTitle: string,
  feedbackUrl: string
) {
  return getResend().emails.send({
    from: FROM(),
    to,
    subject: `Comment s'est passé votre soirée ? — ${eventTitle}`,
    ...templateOrHtml('RESEND_TEMPLATE_FEEDBACK_POST_LIVE', {
      first_name: firstName,
      event_title: eventTitle,
      feedback_url: feedbackUrl,
    }, `
      <p>Bonjour ${firstName},</p>
      <p>Merci d'avoir participé au live <strong>${eventTitle}</strong>. Nous espérons que la soirée a été une bénédiction pour vous.</p>
      <p>En deux minutes, partagez votre ressenti — votre retour aide à améliorer chaque live :</p>
      <p><a href="${feedbackUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Donner mon avis</a></p>
      <p style="color:#64748b;font-size:13px;margin-top:16px;">Ce lien est personnel et valable 7 jours.</p>
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
