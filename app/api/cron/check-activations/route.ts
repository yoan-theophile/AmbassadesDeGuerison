import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendAdminAlertNoActivations } from '@/lib/email/templates';

// Route non enregistrée dans vercel.json — à activer manuellement quand prêt.
// Schedule suggéré : "0 9 * * *" (quotidien 9h UTC), à déclencher J-3 avant chaque live.
// Appel manuel : POST /api/cron/check-activations avec header x-cron-secret.

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: nextEvent, error: eventError } = await supabase
    .from('events')
    .select('id, title, event_date')
    .gt('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(1)
    .single();

  if (eventError || !nextEvent) {
    return NextResponse.json({ skipped: true, reason: 'Aucun prochain événement' });
  }

  const { count, error: countError } = await supabase
    .from('host_activations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', nextEvent.id)
    .eq('is_active', true);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({ alerted: false, activeHosts: count, event: nextEvent.title });
  }

  const eventDate = new Date(nextEvent.event_date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  await sendAdminAlertNoActivations(nextEvent.title, eventDate);

  return NextResponse.json({ alerted: true, activeHosts: 0, event: nextEvent.title });
}
