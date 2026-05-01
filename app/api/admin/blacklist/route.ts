import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const { email, phone, reason } = body;

  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Motif requis' }, { status: 400 });
  }
  if (!email?.trim() && !phone?.trim()) {
    return NextResponse.json({ error: 'Email ou téléphone requis' }, { status: 400 });
  }

  const { supabase, user } = ctx;

  const { data, error } = await supabase
    .from('blacklist')
    .insert({
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      reason: reason.trim(),
      added_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('moderation_log').insert({
    action_type: 'blacklist_add',
    target_id: data.id,
    admin_id: user.id,
    notes: reason.trim(),
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  const { supabase, user } = ctx;

  const { error } = await supabase
    .from('blacklist')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('moderation_log').insert({
    action_type: 'blacklist_remove',
    target_id: id,
    admin_id: user.id,
  });

  return NextResponse.json({ success: true });
}
