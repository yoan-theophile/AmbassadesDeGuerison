import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getTimingConfig } from '@/lib/timing-config';
import { sendFeedbackPostLive } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const [supabase, config] = [createServiceClient(), await getTimingConfig()];

  // Events dont la date est dans la fenêtre [feedbackDaysAfter, feedbackDaysAfter + 1 jour]
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - config.feedback_days_after - 1);
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() - config.feedback_days_after);

  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .gte('event_date', windowStart.toISOString())
    .lte('event_date', windowEnd.toISOString())
    .neq('feedback_sent', true);

  if (!events?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  let totalSent = 0;

  for (const event of events) {
    const { data: contacts } = await supabase
      .from('contact_requests')
      .select('id, visitor_email, visitor_first_name, action_token')
      .eq('status', 'accepted')
      .eq('host_activations.event_id', event.id);

    if (contacts?.length) {
      await Promise.allSettled(
        contacts.map((c) =>
          sendFeedbackPostLive(
            c.visitor_email,
            c.visitor_first_name,
            event.title,
            `${appUrl}/feedback/${c.action_token}`
          )
        )
      );
      totalSent += contacts.length;
    }

    // Marque l'event comme feedback_sent (colonne idempotence)
    await supabase
      .from('events')
      .update({ feedback_sent: true })
      .eq('id', event.id);
  }

  return NextResponse.json({ sent: totalSent });
}
