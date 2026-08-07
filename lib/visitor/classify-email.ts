import { createServiceClient } from '@/lib/supabase/server';
import { getAuthUsersByEmail } from '@/lib/auth/list-all-users';

type ServiceClient = ReturnType<typeof createServiceClient>;

export type EmailClassification = 'new' | 'visitor_existing' | 'collision';

// Utilisé à la fois par la vérification au blur (/api/visitor/check-email)
// et par la création de compte (/api/visitor/account) — un seul point de
// vérité pour ce qui compte comme collision. 'collision' couvre à la fois
// les comptes ambassadeur/admin identifiés (host_profiles) et tout autre
// compte auth.users orphelin (ni visiteur, ni hôte) — traité comme collision
// par défaut plutôt que de risquer une création croisée silencieuse.
export async function classifyVisitorEmail(
  supabase: ServiceClient,
  email: string,
): Promise<EmailClassification> {
  const { data: visitorProfile } = await supabase
    .from('visitor_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (visitorProfile) return 'visitor_existing';

  const { data: hostProfile } = await supabase
    .from('host_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (hostProfile) return 'collision';

  // Pagination obligatoire : `listUsers()` sans argument s'arrête à 50 comptes.
  // Sans ça, une adresse déjà prise au-delà du 50e compte était classée 'new',
  // et la création de compte visiteur échouait ensuite côté Supabase avec une
  // erreur brute au lieu du message de collision prévu (trouvé 2026-08-07).
  const byEmail = await getAuthUsersByEmail(supabase);
  if (byEmail.has(email.toLowerCase())) return 'collision';

  return 'new';
}
