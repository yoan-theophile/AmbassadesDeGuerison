import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Honeypot
  if (body.website) return NextResponse.json({}, { status: 200 });

  const {
    event_id, host_profile_id, contact_request_id,
    visitor_email, direction,
    ratings,
    would_host_again,
    block_visitor, visitor_phone,
    free_text, reported, report_reason,
  } = body;

  if (!event_id || !host_profile_id || !visitor_email?.trim() || !direction) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }
  if (!['visitor_to_host', 'host_to_visitor'].includes(direction)) {
    return NextResponse.json({ error: 'Direction invalide' }, { status: 400 });
  }

  const validateRating = (v: unknown) => {
    if (v === null || v === undefined) return null;
    const n = parseInt(String(v));
    return n >= 1 && n <= 5 ? n : null;
  };

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('live_feedbacks')
    .insert({
      event_id,
      host_profile_id,
      contact_request_id: contact_request_id || null,
      visitor_email: visitor_email.trim().toLowerCase(),
      direction,
      rating_welcome:      validateRating(ratings?.welcome),
      rating_friendliness: validateRating(ratings?.friendliness),
      rating_listening:    validateRating(ratings?.listening),
      rating_prayer:       validateRating(ratings?.prayer),
      would_host_again: direction === 'host_to_visitor' ? Boolean(would_host_again) : null,
      free_text: free_text?.trim() || null,
      reported: !!reported,
      report_reason: reported ? (report_reason?.trim() || null) : null,
      report_status: reported ? 'pending' : null,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Feedback déjà soumis' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Si signalement : INSERT moderation_log (non-bloquant)
  if (reported && data) {
    supabase.from('moderation_log').insert({
      action_type: 'feedback_reported',
      target_id: data.id,
      notes: report_reason?.trim() || null,
    }).then(() => {});
  }

  // Blocage par-ambassadeur (Phase 3 PR3, D.4) — uniquement direction
  // host_to_visitor, non-bloquant (un échec ici ne doit pas faire échouer
  // l'envoi du feedback lui-même).
  if (direction === 'host_to_visitor' && block_visitor) {
    supabase.from('blacklist').insert({
      host_profile_id,
      email: visitor_email.trim().toLowerCase(),
      phone: visitor_phone?.trim() || null,
      reason: 'Blocage post-feedback ambassadeur',
    }).then(() => {});
  }

  return NextResponse.json({ id: data?.id }, { status: 201 });
}
