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

  const target = users.find(u => u.email === email.trim().toLowerCase());
  if (!target) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

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
    notes: `role=${role}`,
  });

  return NextResponse.json({ success: true }, { status: 201 });
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

  await supabase.from('moderation_log').insert({
    action_type: 'admin_revoke',
    target_id: user_id,
    admin_id: user.id,
  });

  return NextResponse.json({ success: true });
}
