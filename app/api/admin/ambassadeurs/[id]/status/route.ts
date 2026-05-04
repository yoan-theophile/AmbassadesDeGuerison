import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { sendValidationFinale } from '@/lib/email/templates';
import { FEATURES } from '@/config/features';

interface Props {
  params: Promise<{ id: string }>;
}

const VALID_ACTIONS = ['validated', 'validated_bypass', 'rejected', 'suspended', 'reactiver'] as const;
type Action = typeof VALID_ACTIONS[number];

const ACTION_STATUS: Record<Action, string> = {
  validated: 'validated',
  validated_bypass: 'validated',
  rejected: 'rejected',
  suspended: 'suspended',
  reactiver: 'validated',
};

export async function POST(req: NextRequest, { params }: Props) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const body = await req.json();
  const { action, notes } = body;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }

  const { supabase, user } = ctx;

  const { data: profile } = await supabase
    .from('host_profiles')
    .select('id, status, first_name, user_id')
    .eq('id', id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'Ambassadeur introuvable' }, { status: 404 });
  }

  // L'action standard 'validated' n'est permise que depuis enrichment_pending
  if (action === 'validated' && profile.status !== 'enrichment_pending') {
    return NextResponse.json(
      { error: 'Le candidat doit d\'abord remplir le questionnaire. Utilisez validated_bypass si nécessaire.' },
      { status: 400 }
    );
  }

  const newStatus = ACTION_STATUS[action as Action];

  const { error } = await supabase
    .from('host_profiles')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from('moderation_log').insert({
    action_type: `ambassador_${action}`,
    target_id: id,
    admin_id: user.id,
    notes: action === 'validated_bypass'
      ? `bypass_enrichment${notes?.trim() ? ` — ${notes.trim()}` : ''}`
      : (notes?.trim() || null),
  });

  if (FEATURES.EMAIL_NOTIFICATIONS && profile.user_id) {
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
    const email = authUser?.user?.email;
    if (email && (action === 'validated' || action === 'validated_bypass')) {
      Promise.allSettled([sendValidationFinale(email, profile.first_name)]);
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}
