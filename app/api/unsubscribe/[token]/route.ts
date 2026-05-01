import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ token: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: recipient } = await supabase
    .from('campaign_recipients')
    .select('id, email')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (!recipient) {
    return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 });
  }

  await supabase
    .from('campaign_recipients')
    .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
    .eq('id', recipient.id);

  // Marque le visiteur comme opt-out dans contact_requests futurs
  await supabase
    .from('contact_requests')
    .update({ visitor_notifications_optin: false })
    .eq('visitor_email', recipient.email);

  return NextResponse.json({ success: true, email: recipient.email });
}
