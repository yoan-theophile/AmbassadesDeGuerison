import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const { event_id } = await req.json();
  if (!event_id) return NextResponse.json({ error: 'event_id requis' }, { status: 400 });

  const { error, count } = await ctx.supabase
    .from('host_activations')
    .update({ is_active: false })
    .eq('event_id', event_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ closed: count ?? 0 });
}
