import type { SupabaseClient, User } from '@supabase/supabase-js';

// `supabase.auth.admin.listUsers()` est paginé et ne retourne que 50 comptes
// par défaut — silencieusement, sans indicateur de troncature.
//
// Trouvé pendant l'audit admin (2026-08-07) : avec 78 comptes en base, les deux
// super admins (créés en premier, donc au-delà de la page 1) s'affichaient
// « Inconnu » dans /admin/team. Le même défaut rendait `POST /api/admin/team`
// incapable de reconnaître un compte existant au-delà du 50e — il en aurait
// réinvité un déjà présent.
//
// perPage est plafonné à 1000 côté Supabase ; on boucle jusqu'à épuisement.
export async function listAllAuthUsers(supabase: SupabaseClient): Promise<User[]> {
  const PER_PAGE = 1000;
  const all: User[] = [];

  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;

    const batch = data?.users ?? [];
    all.push(...batch);

    if (batch.length < PER_PAGE) break;
  }

  return all;
}

/** Index e-mail (normalisé) → utilisateur, sur l'ensemble des comptes. */
export async function getAuthUsersByEmail(supabase: SupabaseClient): Promise<Map<string, User>> {
  const users = await listAllAuthUsers(supabase);
  return new Map(users.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u]));
}

/** Index id → e-mail, sur l'ensemble des comptes. */
export async function getAuthEmailsById(supabase: SupabaseClient): Promise<Map<string, string>> {
  const users = await listAllAuthUsers(supabase);
  return new Map(users.map((u) => [u.id, u.email ?? '']));
}
