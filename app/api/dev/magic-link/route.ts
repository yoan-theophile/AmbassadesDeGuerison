import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isDevOverlayAuthorized, isDevOverlayEnabled } from '@/lib/dev-overlay-auth';

export async function POST(req: NextRequest) {
  // En prod, masquer l'existence du endpoint si le DevOverlay n'est pas activé
  if (!isDevOverlayEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  // Le secret est CRITIQUE ici : la route génère un magic link admin pour
  // n'importe quel email. Sans cette garde, anyone-with-the-URL peut se
  // connecter en tant que david.thery@demo.fr.
  if (!isDevOverlayAuthorized(req)) {
    return NextResponse.json({ error: 'Secret invalide.' }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'E-mail requis.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink`;
  return NextResponse.json({ link });
}
