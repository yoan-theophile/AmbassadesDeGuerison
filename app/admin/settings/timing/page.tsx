import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import TimingConfigClient from './TimingConfigClient';
import { DEFAULTS } from '@/lib/timing-config';

export const dynamic = 'force-dynamic';

export default async function TimingSettingsPage() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('event_timing_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const config = data ?? DEFAULTS;

  return (
    <AdminLayout>
      <TimingConfigClient config={config} />
    </AdminLayout>
  );
}
