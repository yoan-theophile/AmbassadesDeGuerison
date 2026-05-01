import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const { event_id, type, scheduled_at, custom_message } = body;

  if (!event_id || !type || !scheduled_at) {
    return NextResponse.json({ error: 'event_id, type et scheduled_at sont requis' }, { status: 400 });
  }
  if (!['ambassadeurs', 'visiteurs'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }

  const { supabase } = ctx;

  const { data: event } = await supabase
    .from('events')
    .select('id, event_date')
    .eq('id', event_id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
  }
  if (new Date(event.event_date) <= new Date()) {
    return NextResponse.json({ error: 'Événement déjà passé' }, { status: 400 });
  }

  // INSERT campagne
  const { data: campaign, error: campaignError } = await supabase
    .from('scheduled_campaigns')
    .insert({
      event_id,
      type,
      scheduled_at: new Date(scheduled_at).toISOString(),
      custom_message: custom_message?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 });
  }

  // Snapshot destinataires (atomique : si échoue → supprimer la campagne)
  let recipients: { email: string; first_name: string | null; recipient_type: string }[] = [];

  if (type === 'ambassadeurs') {
    const { data: hosts } = await supabase
      .from('host_profiles')
      .select('email, first_name')
      .eq('status', 'validated');
    recipients = (hosts ?? []).map((h) => ({
      email: h.email,
      first_name: h.first_name,
      recipient_type: 'ambassador',
    }));
  } else {
    // visiteurs : contact_requests acceptées pour cet event via host_activations
    const { data: contacts } = await supabase
      .from('contact_requests')
      .select('visitor_email, visitor_first_name, host_activations!inner(event_id)')
      .eq('host_activations.event_id', event_id)
      .eq('status', 'accepted');

    const seen = new Set<string>();
    for (const c of contacts ?? []) {
      if (!seen.has(c.visitor_email)) {
        seen.add(c.visitor_email);
        recipients.push({
          email: c.visitor_email,
          first_name: c.visitor_first_name,
          recipient_type: 'visitor',
        });
      }
    }
  }

  if (recipients.length > 0) {
    const rows = recipients.map((r) => ({
      campaign_id: campaign.id,
      email: r.email,
      first_name: r.first_name,
      recipient_type: r.recipient_type,
    }));

    const { error: recipientsError } = await supabase
      .from('campaign_recipients')
      .insert(rows);

    if (recipientsError) {
      // Rollback : supprimer la campagne orpheline
      await supabase.from('scheduled_campaigns').delete().eq('id', campaign.id);
      return NextResponse.json(
        { error: `Snapshot destinataires échoué : ${recipientsError.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ id: campaign.id, recipients: recipients.length }, { status: 201 });
}
