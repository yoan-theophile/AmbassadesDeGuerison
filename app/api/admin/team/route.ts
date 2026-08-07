import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { requireSuperAdmin } from '@/lib/auth/require-admin';
import { getAuthUsersByEmail } from '@/lib/auth/list-all-users';
import { sendMagicLink } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
  const ctx = await requireSuperAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const { email, role } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  }
  if (!['admin', 'super_admin'].includes(role)) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
  }

  const { supabase, user } = ctx;

  // Cherche l'utilisateur auth par email, sur l'ensemble des comptes :
  // `listUsers()` sans pagination s'arrête à 50 et aurait réinvité un compte
  // déjà existant au-delà (trouvé 2026-08-07).
  let byEmail: Map<string, User>;
  try {
    byEmail = await getAuthUsersByEmail(supabase);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let target: User | undefined = byEmail.get(normalizedEmail);

  // Audit admin 2026-08-07 (8.1) : l'ajout exigeait un compte préexistant, sans
  // qu'aucun écran n'explique où le créer — et il n'en existait aucun. Le seul
  // chemin était que la personne se connecte d'abord d'elle-même sur /auth, ce
  // que rien ne suggérait. Parcours en cul-de-sac.
  //
  // `createUser` + `generateLink`, jamais `inviteUserByEmail` : cette dernière
  // délègue l'envoi au SMTP interne de Supabase, qui ignore `USE_MAILHOG` et
  // Resend. En local rien n'arrivait dans Mailhog, en prod l'e-mail aurait
  // échappé aux logs Resend — dans les deux cas sans la moindre erreur, la
  // méthode répondant 200 avec `invited_at` renseigné (trouvé 2026-08-07).
  // Même raison qu'à l'inscription ambassadeur, qui évite déjà cette méthode
  // (cf app/api/inscriptions/route.ts) : elle est aussi rate-limitée ~2-4/h.
  let invited = false;
  if (!target) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true, // pas de mail de confirmation Supabase : on envoie le nôtre
      user_metadata: { role: 'admin' },
    });
    if (createError || !created?.user) {
      return NextResponse.json(
        { error: `Création du compte impossible : ${createError?.message ?? 'erreur inconnue'}` },
        { status: 500 }
      );
    }
    target = created.user;
    invited = true;
  }

  // `role` dans user_metadata est ce que lisent le middleware proxy.ts et
  // /auth/confirm pour router vers /admin — la table admin_users seule ne
  // suffirait pas à ouvrir l'accès.
  await supabase.auth.admin.updateUserById(target.id, {
    user_metadata: { ...target.user_metadata, role: 'admin' },
  });

  const { error } = await supabase
    .from('admin_users')
    .upsert({ user_id: target.id, role }, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('moderation_log').insert({
    action_type: 'admin_grant',
    target_id: target.id,
    admin_id: user.id,
    notes: `role=${role}${invited ? ' (compte créé par invitation)' : ''}`,
  });

  // Lien de connexion envoyé par notre propre couche e-mail (Mailhog en local,
  // Resend en prod) — donc visible dans les logs et testable hors production.
  // `type: 'magiclink'` correspond à ce que `/auth/confirm` sait vérifier ; un
  // lien `type: 'invite'` aurait échoué sur cette page même s'il était arrivé.
  //
  // Best-effort : l'accès admin est déjà accordé en base à ce stade. Un échec
  // d'envoi ne doit pas faire croire que l'ajout a échoué — il est journalisé
  // et remonté au client, qui propose de renvoyer le lien.
  let emailSent = true;
  try {
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
    });
    if (linkError || !linkData) throw linkError ?? new Error('generateLink a échoué');

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`
      + `?token_hash=${linkData.properties.hashed_token}&type=magiclink`
      + `&redirect=${encodeURIComponent('/admin/stats')}`;
    await sendMagicLink(normalizedEmail, confirmUrl);
  } catch (err) {
    console.error(`[admin/team] envoi du lien de connexion échoué pour ${normalizedEmail}:`, err);
    emailSent = false;
  }

  return NextResponse.json({ success: true, invited, emailSent, email: normalizedEmail }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSuperAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const { user_id } = await req.json();
  if (!user_id) {
    return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
  }

  const { supabase, user } = ctx;

  // Empêche l'auto-révocation
  if (user_id === user.id) {
    return NextResponse.json({ error: 'Impossible de se révoquer soi-même' }, { status: 400 });
  }

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('user_id', user_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Retirer aussi le rôle dans user_metadata — c'est lui que lisent proxy.ts et
  // /auth/confirm. Sans ça, la ligne admin_users disparaît mais la personne
  // continue d'accéder à /admin.
  const { data: targetUser } = await supabase.auth.admin.getUserById(user_id);
  if (targetUser?.user) {
    const meta = { ...targetUser.user.user_metadata };
    delete meta.role;
    await supabase.auth.admin.updateUserById(user_id, { user_metadata: meta });
  }

  await supabase.from('moderation_log').insert({
    action_type: 'admin_revoke',
    target_id: user_id,
    admin_id: user.id,
  });

  return NextResponse.json({ success: true });
}
