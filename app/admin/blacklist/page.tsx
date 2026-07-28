import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import BlacklistClient from './BlacklistClient';

export const dynamic = 'force-dynamic';

export default async function AdminBlacklistPage() {
  const supabase = createServiceClient();

  // Blocages globaux uniquement (host_profile_id NULL) — les blocages
  // par-ambassadeur (Phase 3 PR3, déclenchés depuis le feedback post-live)
  // ne sont pas gérés depuis cette page admin.
  const { data: entries } = await supabase
    .from('blacklist')
    .select('id, email, phone, reason, added_by, created_at')
    .is('host_profile_id', null)
    .order('created_at', { ascending: false });

  return (
    <AdminLayout>
      <BlacklistClient entries={entries ?? []} />
    </AdminLayout>
  );
}
