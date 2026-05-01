import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import BlacklistClient from './BlacklistClient';

export const dynamic = 'force-dynamic';

export default async function AdminBlacklistPage() {
  const supabase = createServiceClient();

  const { data: entries } = await supabase
    .from('blacklist')
    .select('id, email, phone, reason, added_by, created_at')
    .order('created_at', { ascending: false });

  return (
    <AdminLayout>
      <BlacklistClient entries={entries ?? []} />
    </AdminLayout>
  );
}
