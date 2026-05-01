import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendCampagneAmbassadeurs, sendCampagneVisiteurs } from '@/lib/email/templates';

const BATCH_SIZE = 50;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Cherche les campagnes prêtes à envoyer (scheduled_at ≤ now, status=pending)
  const now = new Date().toISOString();
  const { data: campaigns, error: fetchError } = await supabase
    .from('scheduled_campaigns')
    .select('id, type, event_id, custom_message, events(title, event_date)')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(5);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!campaigns?.length) {
    return NextResponse.json({ dispatched: 0 });
  }

  let totalSent = 0;
  const results: { campaign_id: string; sent: number; error?: string }[] = [];

  for (const campaign of campaigns) {
    const event = Array.isArray(campaign.events) ? campaign.events[0] : campaign.events;

    // Marque en cours
    await supabase
      .from('scheduled_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign.id);

    try {
      const sent = await dispatchCampaign(supabase, campaign, event);
      totalSent += sent;

      await supabase
        .from('scheduled_campaigns')
        .update({ status: 'sent', sent_count: sent })
        .eq('id', campaign.id);

      results.push({ campaign_id: campaign.id, sent });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase
        .from('scheduled_campaigns')
        .update({ status: 'failed', error_message: msg })
        .eq('id', campaign.id);
      results.push({ campaign_id: campaign.id, sent: 0, error: msg });
    }
  }

  return NextResponse.json({ dispatched: totalSent, campaigns: results });
}

async function dispatchCampaign(
  supabase: ReturnType<typeof createServiceClient>,
  campaign: { id: string; type: string; event_id: string; custom_message?: string },
  event: { title: string; event_date: string } | null | undefined
) {
  if (!event) throw new Error('Événement introuvable');

  const eventDate = new Date(event.event_date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (campaign.type === 'ambassadeurs') {
    return dispatchAmbassadeursBatch(supabase, campaign, event.title, eventDate, appUrl);
  } else if (campaign.type === 'visiteurs') {
    return dispatchVisiteursBatch(supabase, campaign, event.title, eventDate, appUrl);
  }
  throw new Error(`Type de campagne inconnu : ${campaign.type}`);
}

async function dispatchAmbassadeursBatch(
  supabase: ReturnType<typeof createServiceClient>,
  campaign: { id: string; event_id: string; custom_message?: string },
  eventTitle: string,
  eventDate: string,
  appUrl: string
) {
  let offset = 0;
  let sent = 0;

  while (true) {
    const { data: recipients } = await supabase
      .from('campaign_recipients')
      .select('id, email, first_name')
      .eq('campaign_id', campaign.id)
      .eq('sent', false)
      .range(offset, offset + BATCH_SIZE - 1);

    if (!recipients?.length) break;

    await Promise.allSettled(
      recipients.map(async (r) => {
        const activateUrl = `${appUrl}/dashboard`;
        await sendCampagneAmbassadeurs(
          r.email, r.first_name, eventTitle, eventDate, activateUrl, campaign.custom_message
        );
        await supabase
          .from('campaign_recipients')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', r.id);
        sent++;
      })
    );

    if (recipients.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return sent;
}

async function dispatchVisiteursBatch(
  supabase: ReturnType<typeof createServiceClient>,
  campaign: { id: string; event_id: string },
  eventTitle: string,
  eventDate: string,
  appUrl: string
) {
  let offset = 0;
  let sent = 0;

  while (true) {
    const { data: recipients } = await supabase
      .from('campaign_recipients')
      .select('id, email, first_name, unsubscribe_token')
      .eq('campaign_id', campaign.id)
      .eq('sent', false)
      .range(offset, offset + BATCH_SIZE - 1);

    if (!recipients?.length) break;

    await Promise.allSettled(
      recipients.map(async (r) => {
        const unsubUrl = `${appUrl}/unsubscribe/${r.unsubscribe_token}`;
        await sendCampagneVisiteurs(r.email, r.first_name, eventTitle, eventDate, unsubUrl);
        await supabase
          .from('campaign_recipients')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', r.id);
        sent++;
      })
    );

    if (recipients.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return sent;
}
