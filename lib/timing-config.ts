import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

export type TimingConfig = {
  campaign_ambassadors_days_before: number;
  campaign_visitors_days_before: number;
  host_reminder_days_before: number;
  visitor_auto_decline_days_before: number;
  feedback_days_after: number;
  queue_aging_days: number;
};

export const DEFAULTS: TimingConfig = {
  campaign_ambassadors_days_before: 7,
  campaign_visitors_days_before: 3,
  host_reminder_days_before: 2,
  visitor_auto_decline_days_before: 1,
  feedback_days_after: 1,
  queue_aging_days: 5,
};

export const getTimingConfig = unstable_cache(
  async (): Promise<TimingConfig> => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('event_timing_config')
      .select(
        'campaign_ambassadors_days_before, campaign_visitors_days_before, ' +
        'host_reminder_days_before, visitor_auto_decline_days_before, ' +
        'feedback_days_after, queue_aging_days'
      )
      .eq('id', 1)
      .single();

    return (data as TimingConfig | null) ?? DEFAULTS;
  },
  ['event-timing-config'],
  { revalidate: 60 }
);
