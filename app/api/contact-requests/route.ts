import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();
  const { host_activation_id, visitor_first_name, visitor_email, visitor_message } = body;

  if (!host_activation_id || !visitor_first_name?.trim() || !visitor_email?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  // Vérifie que l'activation est active et non complète
  const { data: activation } = await supabase
    .from('host_activations')
    .select('id, is_active, is_full, host_profiles!inner(contact_mode)')
    .eq('id', host_activation_id)
    .single();

  if (!activation?.is_active) {
    return NextResponse.json({ error: 'Ambassade non disponible' }, { status: 410 });
  }
  if (activation.is_full) {
    return NextResponse.json({ error: 'Ambassade complète' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      host_activation_id,
      visitor_first_name: visitor_first_name.trim(),
      visitor_email: visitor_email.trim().toLowerCase(),
      visitor_message: visitor_message?.trim() ?? null,
    })
    .select('id, action_token')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Demande déjà envoyée' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
