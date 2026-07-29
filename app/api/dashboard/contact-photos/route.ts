import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';

const BUCKET = 'visitor-photos';

// Photo visiteur affichée dans le dashboard hôte via un lien vers une page
// authentifiée (pas une image embarquée dans l'email — cf /plan-eng-review,
// décision 4) : signed URL fraîche générée à chaque vue, jamais mise en cache
// long terme comme pour la carte publique (audience beaucoup plus restreinte,
// pas de bénéfice à cacher). visitor_profiles reste owner-only en RLS — cette
// route utilise le service client, contrainte par une vérification explicite
// d'ownership (le contact_request doit appartenir à un host_activation de
// l'hôte connecté), pour ne jamais élargir l'accès aux autres colonnes
// (email, téléphone) du profil visiteur.
export async function POST(req: NextRequest) {
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids = (body as { contact_request_ids?: unknown }).contact_request_ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 20) {
    return NextResponse.json({ error: 'contact_request_ids invalide' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: hostProfile } = await supabase
    .from('host_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!hostProfile) return NextResponse.json({ error: 'Profil ambassadeur introuvable' }, { status: 404 });

  const { data: rows } = await supabase
    .from('contact_requests')
    .select('id, visitor_profile_id, host_activation_id, host_activations!inner(host_profile_id)')
    .in('id', ids)
    .eq('host_activations.host_profile_id', hostProfile.id);

  const profileIds = (rows ?? [])
    .map((r) => r.visitor_profile_id)
    .filter((id): id is string => Boolean(id));

  if (profileIds.length === 0) return NextResponse.json({});

  const { data: visitorProfiles } = await supabase
    .from('visitor_profiles')
    .select('id, photo_url')
    .in('id', profileIds);

  const photoByProfileId = new Map(
    (visitorProfiles ?? []).filter((p) => p.photo_url).map((p) => [p.id, p.photo_url as string]),
  );

  const result: Record<string, string> = {};
  for (const row of rows ?? []) {
    const path = row.visitor_profile_id ? photoByProfileId.get(row.visitor_profile_id) : undefined;
    if (!path) continue;
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 900);
    if (signed?.signedUrl) result[row.id] = signed.signedUrl;
  }

  return NextResponse.json(result);
}
