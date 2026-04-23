import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendMagicLink } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
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

  // On envoie un lien vers notre propre app, pas vers supabase.co/auth/v1/verify.
  // Les scanners email (Gmail, Outlook…) pré-fetchen les URLs et consommeraient
  // le token à usage unique avant que l'utilisateur clique.
  // Notre page /auth/confirm est un Client Component : les scanners voient du HTML,
  // n'exécutent pas le JS, et ne consomment pas le token.
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink`;
  await sendMagicLink(email, confirmUrl);

  return NextResponse.json({ success: true });
}
