import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();
  const { action } = body;

  if (action !== 'approve' && action !== 'decline') {
    return NextResponse.json({ error: 'action doit être approve ou decline.' }, { status: 400 });
  }

  if (action === 'approve') {
    const { error } = await supabase
      .from('testimonials')
      .update({ is_visible: true })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // decline: supprimer
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
