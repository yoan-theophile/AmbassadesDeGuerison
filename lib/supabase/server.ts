import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service role client — bypass RLS.
// Utilisé UNIQUEMENT dans Server Components et Route Handlers.
// Ne jamais importer depuis un fichier client (Client Component).
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'public' },
      auth: { persistSession: false },
      global: {
        headers: { 'x-client-info': 'davidthery-app/server' },
      },
    }
  );
}
