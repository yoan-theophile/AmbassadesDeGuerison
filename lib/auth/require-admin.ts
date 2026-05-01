import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export type AdminContext = {
  user: User;
  supabase: SupabaseClient;
};

function makeAnonClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );
}

export async function requireAdmin(
  req: NextRequest
): Promise<AdminContext | NextResponse> {
  const client = makeAnonClient(req);

  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { data: isAdmin } = await client.rpc('is_admin', { uid: user.id });
  if (!isAdmin) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  return { user, supabase: createServiceClient() };
}

export async function requireSuperAdmin(
  req: NextRequest
): Promise<AdminContext | NextResponse> {
  const client = makeAnonClient(req);

  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { data: isSuperAdmin } = await client.rpc('is_super_admin', { uid: user.id });
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Accès refusé. Réservé aux super admins.' }, { status: 403 });
  }

  return { user, supabase: createServiceClient() };
}
