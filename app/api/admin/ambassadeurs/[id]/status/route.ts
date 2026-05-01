import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { sendPreValidationAccordee, sendValidationFinale } from '@/lib/email/templates';
import { FEATURES } from '@/config/features';

interface Props {
  params: Promise<{ id: string }>;
}

const VALID_ACTIONS = ['pre_approved', 'validated', 'rejected', 'suspended', 'reactiver'] as const;
type Action = typeof VALID_ACTIONS[number];

const ACTION_STATUS: Record<Action, string> = {
  pre_approved: 'pre_approved',
  validated: 'validated',
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
    notes: notes?.trim() || null,
  });

  if (FEATURES.EMAIL_NOTIFICATIONS && profile.user_id) {
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
    const email = authUser?.user?.email;
    if (email) {
      if (action === 'pre_approved') {
        const videoUrl = process.env.NEXT_PUBLIC_ONBOARDING_VIDEO_URL || '';
        const pdfUrl = process.env.NEXT_PUBLIC_ONBOARDING_PDF_URL || '';
        Promise.allSettled([
          sendPreValidationAccordee(email, profile.first_name, videoUrl, pdfUrl),
        ]);
      } else if (action === 'validated') {
        Promise.allSettled([sendValidationFinale(email, profile.first_name)]);
      }
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}
