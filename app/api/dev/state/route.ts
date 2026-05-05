import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { applyState, type DevState } from '@/lib/dev/state';
import { isDevOverlayAuthorized, isDevOverlayEnabled } from '@/lib/dev-overlay-auth';

const VALID_STATES: DevState[] = ['live', 'live-zero', 'soon', 'soon-confirmed', 'upcoming', 'upcoming-confirmed', 'past', 'closed', 'blank'];

export async function POST(req: NextRequest) {
  // En prod, masquer l'existence du endpoint si le DevOverlay n'est pas activé
  if (!isDevOverlayEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  // Si activé, exiger le secret en header (sauf en dev local)
  if (!isDevOverlayAuthorized(req)) {
    return NextResponse.json({ error: 'Secret invalide.' }, { status: 403 });
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
