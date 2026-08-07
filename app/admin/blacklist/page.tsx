import { createServiceClient } from '@/lib/supabase/server';
import { getAuthEmailsById } from '@/lib/auth/list-all-users';
import AdminLayout from '@/components/AdminLayout';
import BlacklistClient from './BlacklistClient';

export const dynamic = 'force-dynamic';

export default async function AdminBlacklistPage() {
  const supabase = createServiceClient();

  // Audit admin 2026-08-07 (7.1) : la page ne listait que les blocages globaux
  // (`host_profile_id IS NULL`). Les blocages créés par les ambassadeurs
  // eux-mêmes depuis leur formulaire de feedback post-live étaient invisibles
  // ici, sans la moindre mention — l'admin croyait voir tous les blocages alors
  // qu'une catégorie entière n'apparaissait sur aucun écran.
  const { data: entries } = await supabase
    .from('blacklist')
    .select('id, email, phone, reason, added_by, created_at, host_profile_id, host_profiles(first_name, city)')
    .order('created_at', { ascending: false });

  // Résoudre l'e-mail de l'admin auteur du blocage (audit 7.5).
  // Paginé : `listUsers()` seul s'arrête à 50 comptes.
  const emailById = await getAuthEmailsById(supabase);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((entries ?? []) as any[]).map((e) => {
    const host = Array.isArray(e.host_profiles) ? e.host_profiles[0] : e.host_profiles;
    return {
      id: e.id as string,
      email: e.email as string | null,
      phone: e.phone as string | null,
      reason: e.reason as string,
      created_at: e.created_at as string,
      addedByEmail: e.added_by ? emailById.get(e.added_by) ?? null : null,
      // Renseigné = blocage scopé à cette ambassade, créé depuis le feedback
      // post-live de l'hôte. NULL = blocage global créé ici.
      scopedToHost: e.host_profile_id
        ? { firstName: (host?.first_name as string) ?? '?', city: (host?.city as string) ?? '' }
        : null,
    };
  });

  return (
    <AdminLayout>
      <BlacklistClient entries={rows} />
    </AdminLayout>
  );
}
