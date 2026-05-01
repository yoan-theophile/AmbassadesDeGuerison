import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json();

  // is_full est calculé par trigger DB — non writable ici
  const { is_active } = body;

  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active (boolean) requis' }, { status: 400 });
  }

  // Client anon avec cookies : la RLS policy host_activations_host_update
  // vérifie auth.uid() = host_profiles.user_id via la jointure FK
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { error } = await supabase
    .from('host_activations')
    .update({ is_active })
    .eq('id', id);

  if (error) {
    const status = error.code === '42501' || error.message.includes('policy') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ success: true });
}
