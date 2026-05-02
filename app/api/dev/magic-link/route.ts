import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 });
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
