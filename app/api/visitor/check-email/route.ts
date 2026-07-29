import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { classifyVisitorEmail } from '@/lib/visitor/classify-email';

// Vérification au blur (écran /mon-espace/creer) — évite de faire remplir
// téléphone + uploader une photo avant de découvrir une collision de compte
// (cf /plan-design-review). Rate-limité (proxy.ts) : cet endpoint répond au
// statut d'un email avant authentification, pattern classique d'énumération
// d'utilisateurs si non protégé (cf /plan-eng-review, passe 2). Réponse
// minimale — jamais l'email en clair ni d'autre donnée de profil.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = (body as { email?: unknown }).email;

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'E-mail invalide' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const status = await classifyVisitorEmail(supabase, email.trim().toLowerCase());

  return NextResponse.json({ status });
}
