import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { applyState, type DevState } from '@/lib/dev/state';

const VALID_STATES: DevState[] = ['live', 'live-zero', 'soon', 'upcoming', 'past', 'closed', 'blank'];

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 });
  }

  const { state } = await req.json();
  if (!VALID_STATES.includes(state)) {
    return NextResponse.json({ error: 'État invalide.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  try {
    await applyState(supabase, state as DevState);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue.' },
      { status: 500 },
    );
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, state });
}
