import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendNewContactRequestHost } from '@/lib/email/templates';
import { FEATURES } from '@/config/features';

type ServiceClient = ReturnType<typeof createServiceClient>;

// Compte visiteur créé silencieusement à la première demande — Supabase Auth
// (pas de token UUID custom, cf learning management-token-lost-link-problem :
// un lien perdu = ticket support inévitable pour un profil permanent).
// user_metadata.role='visitor' distingue ce compte des hôtes/admins pour le
// routage post-login (/auth/confirm).
async function createOrUpdateVisitorProfile(
  supabase: ServiceClient,
  email: string,
  phone: string | null,
): Promise<void> {
  const { data: existingProfile } = await supabase
    .from('visitor_profiles')
    .select('id, user_id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    if (phone) {
      await supabase.from('visitor_profiles').update({ phone }).eq('id', existingProfile.id);
    }
    return;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { role: 'visitor' },
  });

  let userId: string | undefined = authData?.user?.id;

  if (authError) {
    if (!authError.message.toLowerCase().includes('already')) return; // best-effort, ne bloque jamais la demande
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    userId = existingUsers?.users.find((u) => u.email === email)?.id;
  }

  if (!userId) return;

  await supabase.from('visitor_profiles').insert({ user_id: userId, email, phone });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Honeypot — bots fill the hidden "website" field
  if (body.website) return NextResponse.json({}, { status: 200 });

  const { event_id, host_profile_id, first_name, email, phone, nb_personnes, message, consent } = body;

  if (!event_id || !host_profile_id || !first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: 'Consentement requis' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const emailLower = email.trim().toLowerCase();
  const phoneTrimmed = phone?.trim() || null;

  // Blacklist — refus honnête (403) sans dévoiler le mécanisme.
  // Choix éthique : pas de shadow-ban (faux 201). David est pasteur, le produit
  // ne ment pas à ses utilisateurs, même problématiques. Le message reste neutre
  // pour ne pas confirmer au visiteur qu'il est blacklisté ; une voie de recours
  // est offerte si c'est une erreur.
  const blacklistFilter = phoneTrimmed
    ? `email.eq.${emailLower},phone.eq.${phoneTrimmed}`
    : `email.eq.${emailLower}`;
  const { data: blocked } = await supabase
    .from('blacklist')
    .select('id')
    .or(blacklistFilter)
    .limit(1)
    .maybeSingle();
  if (blocked) {
    return NextResponse.json(
      { error: "Votre demande ne peut pas être prise en compte. Si vous pensez qu'il s'agit d'une erreur, contactez l'équipe." },
      { status: 403 },
    );
  }

  // Vérifier que l'event existe et que les inscriptions ne sont pas fermées.
  // Pas de gate d'ouverture : dès qu'une fiche d'ambassade est visible, l'inscription
  // est possible. La fermeture (registration_closes_at) est posée automatiquement
  // par le trigger DB à event_date.
  const now = new Date().toISOString();
  const { data: event } = await supabase
    .from('events')
    .select('id, registration_closes_at')
    .eq('id', event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
  }
  if (event.registration_closes_at && now > event.registration_closes_at) {
    return NextResponse.json({ error: 'Les inscriptions sont fermées' }, { status: 400 });
  }

  // Vérifier que l'ambassade est activée pour ce live
  const { data: act } = await supabase
    .from('host_activations')
    .select('id, is_active, is_full')
    .eq('host_profile_id', host_profile_id)
    .eq('event_id', event_id)
    .maybeSingle();

  if (!act) {
    return NextResponse.json({ error: "Ambassade non disponible pour ce live" }, { status: 404 });
  }
  if (!act.is_active) {
    return NextResponse.json({ error: "Cette ambassade n'a pas encore ouvert ses portes pour ce live" }, { status: 410 });
  }
  if (act.is_full) {
    return NextResponse.json({ error: 'Cette ambassade est complète' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      host_activation_id: act.id,
      visitor_first_name: first_name.trim(),
      visitor_email: emailLower,
      visitor_phone: phoneTrimmed,
      nb_personnes: Math.max(1, parseInt(String(nb_personnes)) || 1),
      visitor_message: message?.trim() || null,
    })
    .select('id, action_token')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Vous avez déjà fait une demande pour cette ambassade' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Phase 2bis — profil visiteur silencieux (aucune étape "créer un compte"
  // visible). Best-effort : un échec ici ne doit jamais faire échouer la
  // demande de visite elle-même, c'est un confort en plus, pas une dépendance.
  createOrUpdateVisitorProfile(supabase, emailLower, phoneTrimmed).catch(() => {});

  if (FEATURES.EMAIL_NOTIFICATIONS) {
    const { data: host } = await supabase
      .from('host_profiles')
      .select('email, first_name, whatsapp_group_url')
      .eq('id', host_profile_id)
      .single();

    if (host) {
      const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accueillir/${data.action_token}`;
      const declineUrl = `${process.env.NEXT_PUBLIC_APP_URL}/refuser/${data.action_token}`;
      Promise.allSettled([
        sendNewContactRequestHost(
          host.email,
          host.first_name,
          first_name.trim(),
          emailLower,
          phoneTrimmed,
          message?.trim() || null,
          acceptUrl,
          declineUrl,
        ),
      ]);
    }
  }

  return NextResponse.json({ id: data.id, action_token: data.action_token }, { status: 201 });
}
