import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;

  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body;

  if (status !== 'suspended' && status !== 'active') {
    return NextResponse.json(
      { error: 'Statut invalide. Valeurs acceptées : suspended, active.' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from('host_profiles')
    .select('id')
    .eq('id', id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 });
  }

  const { error } = await supabase
    .from('host_profiles')
    .update({ status })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
