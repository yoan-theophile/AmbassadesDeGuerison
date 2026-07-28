import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import FeedbackModerationClient from './FeedbackModerationClient';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  const supabase = createServiceClient();

  // Toutes les notations (pas seulement les signalements) — Phase 3 PR3 :
  // le dashboard filtres (D.6) a besoin de voir l'ensemble pour trier par
  // live/score, pas seulement la file de modération des signalements.
  const { data: feedbacks } = await supabase
    .from('live_feedbacks')
    .select(`
      id, visitor_email, direction, report_reason, report_status, reported,
      report_handled_at, free_text, created_at, would_host_again,
      rating_welcome, rating_friendliness, rating_listening, rating_prayer,
      events(id, title, event_date),
      host_profiles(first_name, city)
    `)
    .order('created_at', { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typed = (feedbacks ?? []) as any[];

  return (
    <AdminLayout>
      <FeedbackModerationClient feedbacks={typed} />
    </AdminLayout>
  );
}
