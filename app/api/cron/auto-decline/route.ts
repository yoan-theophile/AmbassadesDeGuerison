import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getTimingConfig } from '@/lib/timing-config';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const [supabase, config] = [createServiceClient(), await getTimingConfig()];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + config.visitor_auto_decline_days_before);

  // Demandes pending dont l'event est dans moins de X jours
  const { data: toDecline } = await supabase
    .from('contact_requests')
    .select(`
      id, visitor_email, visitor_first_name,
      host_activations!inner(
        events!inner(event_date),
        host_profiles!inner(first_name)
      )
    `)
    .eq('status', 'pending')
    .lte('host_activations.events.event_date', cutoff.toISOString());

  if (!toDecline?.length) {
    return NextResponse.json({ declined: 0 });
  }

  const ids = toDecline.map((c) => c.id);
  const { error } = await supabase
    .from('contact_requests')
    .update({ status: 'cancelled_no_response' })
    .in('id', ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ declined: ids.length });
}
