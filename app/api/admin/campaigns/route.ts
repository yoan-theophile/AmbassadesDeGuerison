import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { getUnsubscribedEmails } from '@/lib/campaigns/unsubscribed';

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

  // Le désabonnement se joue ici, à la constitution du snapshot : une fois la
  // ligne `campaign_recipients` écrite, le cron de dispatch envoie sans plus
  // rien revérifier.
  const unsubscribed = await getUnsubscribedEmails(supabase);

  // Pagination obligatoire ici : PostgREST tronque à 1000 lignes en silence.
  // Un snapshot tronqué priverait les ambassadeurs au-delà du 1000e de leur
  // lien d'activation — donc de toute présence sur la carte au prochain live —
  // sans qu'aucune erreur ne le signale.
  if (type === 'ambassadeurs') {
    const hosts = await fetchAllRows<{ email: string; first_name: string | null }>(() =>
      supabase
        .from('host_profiles')
        .select('email, first_name')
        .eq('status', 'validated')
        .order('created_at', { ascending: true })
    );
    recipients = hosts
      .filter((h) => !unsubscribed.has(h.email.toLowerCase()))
      .map((h) => ({
        email: h.email,
        first_name: h.first_name,
        recipient_type: 'ambassador',
      }));
  } else {
    // visiteurs : contact_requests acceptées pour cet event via host_activations
    const contacts = await fetchAllRows<{ visitor_email: string; visitor_first_name: string | null }>(() =>
      supabase
        .from('contact_requests')
        .select('visitor_email, visitor_first_name, host_activations!inner(event_id)')
        .eq('host_activations.event_id', event_id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: true })
    );

    const seen = new Set<string>();
    for (const c of contacts) {
      if (unsubscribed.has(c.visitor_email.toLowerCase())) continue;
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

// Annulation d'une campagne encore en attente (audit admin 2026-08-07, 4.7) —
// sans cette route, une erreur de date ou de destinataire était définitive.
// Restreint à `pending` : une campagne déjà envoyée ne peut pas être reprise,
// et supprimer sa trace masquerait un envoi réel.
export async function DELETE(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const { supabase } = ctx;

  const { data: campaign } = await supabase
    .from('scheduled_campaigns')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }
  if (campaign.status !== 'pending') {
    return NextResponse.json(
      { error: 'Seule une campagne en attente peut être annulée.' },
      { status: 400 }
    );
  }

  // Les destinataires snapshottés partent avec la campagne.
  await supabase.from('campaign_recipients').delete().eq('campaign_id', id);

  const { error } = await supabase.from('scheduled_campaigns').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
