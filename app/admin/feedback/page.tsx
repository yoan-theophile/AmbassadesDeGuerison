import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import FeedbackModerationClient from './FeedbackModerationClient';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  const supabase = createServiceClient();

  const { data: feedbacks } = await supabase
    .from('live_feedbacks')
    .select(`
      id, visitor_email, direction, report_reason, report_status,
      report_handled_at, free_text, created_at,
      rating_welcome, rating_friendliness, rating_listening, rating_prayer,
      events(title, event_date),
      host_profiles(first_name, city)
    `)
    .eq('reported', true)
    .order('report_status', { ascending: true })
    .order('created_at', { ascending: false });

  return (
    <AdminLayout>
      <FeedbackModerationClient feedbacks={feedbacks ?? []} />
    </AdminLayout>
  );
}
