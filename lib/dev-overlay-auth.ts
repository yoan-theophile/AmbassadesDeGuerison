import type { NextRequest } from 'next/server';

/**
 * Garde commune des routes /api/dev/* :
 * - En dev local (NODE_ENV=development) : toujours autorisé.
 * - En prod : autorisé uniquement si DEV_OVERLAY_SECRET est défini ET que la
 *   requête fournit le même secret dans le header `x-dev-secret`.
 *
 * Le DevOverlay UI demande ce secret au premier usage en prod et le stocke
 * en localStorage côté client (`dev-overlay-secret`).
 */
export function isDevOverlayAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const expected = process.env.DEV_OVERLAY_SECRET;
  if (!expected) return false;
  const provided = req.headers.get('x-dev-secret');
  return provided === expected;
}

/**
 * Indique si le DevOverlay doit être actif pour cette instance Next.js.
 * Côté client, lire `process.env.NEXT_PUBLIC_DEV_OVERLAY` directement (inliné
 * au build). Côté server, on combine avec NODE_ENV.
 */
export function isDevOverlayEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_DEV_OVERLAY === 'true'
  );
}
