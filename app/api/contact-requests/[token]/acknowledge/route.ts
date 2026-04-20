import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();

  // Token valide 7 jours (calcul dynamique, pas de colonne expires_at)
  const expiresAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('contact_requests')
    .select(`
      id, status, onboarding_completed,
      host_activations!inner (
        host_profiles!inner (
          first_name, address_private, whatsapp, consignes
        )
      )
    `)
    .eq('action_token', token)
    .gt('created_at', expiresAt)
    .single();

  if (error || !data) {
    // 410 Gone = token expiré. Client doit distinguer des 404.
    return NextResponse.json({ error: 'Token expiré ou invalide' }, { status: 410 });
  }

  if (data.status !== 'accepted') {
    return NextResponse.json({ error: 'Demande non acceptée' }, { status: 403 });
  }

  await supabase
    .from('contact_requests')
    .update({ onboarding_completed: true })
    .eq('action_token', token);

  const ha = data.host_activations as any;
  const hp = ha?.host_profiles;

  return NextResponse.json({
    address: hp?.address_private ?? null,
    whatsapp: hp?.whatsapp ?? null,
    consignes: hp?.consignes ?? null,
    host_first_name: hp?.first_name ?? null,
  });
}

// Lecture des consignes (avant le clic "J'ai bien pris note")
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();

  const expiresAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('contact_requests')
    .select(`
      id, status, onboarding_completed,
      host_activations!inner (
        host_profiles!inner (first_name, consignes)
      )
    `)
    .eq('action_token', token)
    .gt('created_at', expiresAt)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Token expiré ou invalide' }, { status: 410 });
  }

  if (data.status !== 'accepted') {
    return NextResponse.json({ error: 'Demande non acceptée' }, { status: 403 });
  }

  const ha = data.host_activations as any;
  const hp = ha?.host_profiles;

  return NextResponse.json({
    host_first_name: hp?.first_name ?? null,
    consignes: hp?.consignes ?? null,
    already_acknowledged: data.onboarding_completed,
  });
}
