import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const { is_active, is_full } = await req.json();

  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (typeof is_active === 'boolean') updates.is_active = is_active;
  if (typeof is_full === 'boolean') updates.is_full = is_full;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour.' }, { status: 400 });
  }

  const { error } = await supabase.from('host_activations').update(updates).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
