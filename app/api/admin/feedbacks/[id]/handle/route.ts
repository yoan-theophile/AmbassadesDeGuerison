import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const body = await req.json();
  const { action, resolution } = body;

  if (!['reviewing', 'resolved', 'dismissed'].includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }

  const { supabase, user } = ctx;

  const { error } = await supabase
    .from('live_feedbacks')
    .update({
      report_status: action,
      report_handled_by: user.id,
      report_handled_at: new Date().toISOString(),
      report_resolution: resolution?.trim() || null,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Journal de modération append-only
  await supabase.from('moderation_log').insert({
    action_type: `feedback_${action}`,
    target_id: id,
    admin_id: user.id,
    notes: resolution?.trim() || null,
  });

  return NextResponse.json({ success: true });
}
