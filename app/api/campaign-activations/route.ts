import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { activation_token } = await req.json();

  if (!activation_token) {
    return NextResponse.json({ error: 'activation_token requis' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Lookup du destinataire par token
  const { data: recipient } = await supabase
    .from('campaign_recipients')
    .select('id, campaign_id, recipient_type, status, scheduled_campaigns(event_id)')
    .eq('activation_token', activation_token)
    .eq('recipient_type', 'ambassador')
    .maybeSingle();

  if (!recipient) {
    return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 });
  }

  const campaign = Array.isArray(recipient.scheduled_campaigns)
    ? recipient.scheduled_campaigns[0]
    : recipient.scheduled_campaigns;

  if (!campaign?.event_id) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
  }

  // Retrouver l'email de ce recipient pour identifier host_profile
  const { data: recipientWithEmail } = await supabase
    .from('campaign_recipients')
    .select('email')
    .eq('id', recipient.id)
    .single();

  const { data: hostProfile } = await supabase
    .from('host_profiles')
    .select('id')
    .eq('email', recipientWithEmail?.email ?? '')
    .eq('status', 'validated')
    .maybeSingle();

  if (!hostProfile) {
    return NextResponse.json({ error: 'Ambassadeur non trouvé ou non validé' }, { status: 403 });
  }

  // Activer host_activation — idempotent
  const { error: activationError } = await supabase
    .from('host_activations')
    .update({ is_active: true })
    .eq('host_profile_id', hostProfile.id)
    .eq('event_id', campaign.event_id);

  if (activationError) {
    return NextResponse.json({ error: activationError.message }, { status: 500 });
  }

  // Marquer le recipient comme activé
  await supabase
    .from('campaign_recipients')
    .update({ status: 'activated' })
    .eq('id', recipient.id);

  return NextResponse.json({ success: true });
}
