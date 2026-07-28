import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

export default async function AdminTeamPage() {
  const supabase = createServiceClient();

  const { data: adminUsers } = await supabase
    .from('admin_users')
    .select('user_id, role, added_at')
    .order('added_at', { ascending: true });

  // Enrichir avec les emails depuis auth.users (service role)
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const userMap = new Map(users.map((u) => [u.id, u.email ?? '']));

  const members = (adminUsers ?? []).map((a) => ({
    user_id: a.user_id,
    role: a.role as string,
    email: userMap.get(a.user_id) ?? 'Inconnu',
    added_at: a.added_at as string,
  }));

  return (
    <AdminLayout>
      <TeamClient members={members} />
    </AdminLayout>
  );
}
