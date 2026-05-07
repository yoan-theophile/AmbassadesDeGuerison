import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendAideVisiteurAdmin } from '@/lib/email/templates';
import { FEATURES } from '@/config/features';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Honeypot
  if (body.website) return NextResponse.json({}, { status: 200 });

  const { email, message, event_id } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  }
  if (!message?.trim() || message.trim().length < 10) {
    return NextResponse.json({ error: 'Message trop court (min 10 caractères)' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Blacklist — refus honnête (403). Voir /api/visit-requests pour le détail
  // du choix éthique (pas de shadow-ban, message neutre, voie de recours).
  const { data: blocked } = await supabase
    .from('blacklist')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (blocked) {
    return NextResponse.json(
      { error: "Votre demande ne peut pas être prise en compte. Si vous pensez qu'il s'agit d'une erreur, contactez l'équipe." },
      { status: 403 },
    );
  }

  await supabase.from('moderation_log').insert({
    action_type: 'visitor_help_request',
    target_id: null,
    notes: JSON.stringify({
      email: email.trim().toLowerCase(),
      message: message.trim().slice(0, 500),
      event_id: event_id || null,
    }),
  });

  if (FEATURES.EMAIL_NOTIFICATIONS) {
    await sendAideVisiteurAdmin(email.trim().toLowerCase(), message.trim().slice(0, 500)).catch(() => {});
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
