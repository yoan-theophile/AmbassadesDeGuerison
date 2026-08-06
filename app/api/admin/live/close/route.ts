import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const { event_id } = await req.json();
  if (!event_id) return NextResponse.json({ error: 'event_id requis' }, { status: 400 });

  const { error: activationsError, count } = await ctx.supabase
    .from('host_activations')
    .update({ is_active: false })
    .eq('event_id', event_id);

  if (activationsError) {
    return NextResponse.json({ error: activationsError.message }, { status: 500 });
  }

  const { error: eventError } = await ctx.supabase
    .from('events')
    .update({ closed_at: new Date().toISOString() })
    .eq('id', event_id);

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  return NextResponse.json({ closed: count ?? 0 });
}
