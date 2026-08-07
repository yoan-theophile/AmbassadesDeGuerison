import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/require-admin';

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

  // Cherche l'utilisateur auth par email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let target = users.find(u => u.email === normalizedEmail);

  // Audit admin 2026-08-07 (8.1) : l'ajout exigeait un compte préexistant, sans
  // qu'aucun écran n'explique où le créer — et il n'en existait aucun. Le seul
  // chemin était que la personne se connecte d'abord d'elle-même sur /auth, ce
  // que rien ne suggérait. Parcours en cul-de-sac.
  //
  // On invite désormais l'adresse : Supabase crée le compte et envoie un lien
  // de connexion. `invited` remonte au client pour que l'UI dise ce qui s'est
  // réellement passé.
  let invited = false;
  if (!target) {
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      normalizedEmail,
      { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm` }
    );
    if (inviteError || !inviteData?.user) {
      return NextResponse.json(
        { error: `Invitation impossible : ${inviteError?.message ?? 'erreur inconnue'}` },
        { status: 500 }
      );
    }
    target = inviteData.user;
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

  return NextResponse.json({ success: true, invited, email: normalizedEmail }, { status: 201 });
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
