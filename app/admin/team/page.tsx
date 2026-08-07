import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import AdminLayout from '@/components/AdminLayout';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

// L'UI d'écriture est réservée aux super admins (audit 8.2) : sans cette
// information, le formulaire s'affichait pour tous et échouait en 403.
async function getCurrentAdmin(): Promise<{ id: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const anon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await anon.auth.getUser();
    if (!user) return null;

    const { data } = await createServiceClient()
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    return { id: user.id, role: (data?.role as string) ?? 'admin' };
  } catch {
    return null;
  }
}

export default async function AdminTeamPage() {
  const supabase = createServiceClient();

  const [current, { data: adminUsers }] = await Promise.all([
    getCurrentAdmin(),
    supabase
      .from('admin_users')
      .select('user_id, role, added_at')
      .order('added_at', { ascending: true }),
  ]);

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
      <TeamClient
        members={members}
        currentRole={current?.role ?? null}
        currentUserId={current?.id ?? null}
      />
    </AdminLayout>
  );
}
