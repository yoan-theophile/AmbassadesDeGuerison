import { describe, it, expect } from 'vitest';

// Logique extraite de components/dashboard/StatusTimeline.tsx (commit ab62970).
// enrichment_pending devrait toujours impliquer un dossier complet (garde API sur
// PATCH /api/ambassadeur/enrichissement), mais une donnée créée hors de ce chemin
// (test, script, migration directe) peut violer l'invariant. Le composant revérifie
// profile_photo_url + room_photo_urls et retombe sur l'étape "pre_approved" plutôt que
// d'afficher "Profil enrichi ✓ — David examine votre dossier" pour un dossier vide.

const STATUS_TO_STEP: Record<string, number> = {
  pending_review: 1,
  pre_approved: 2,
  enrichment_pending: 3,
  validated: 4,
  suspended: 4,
  rejected: 4,
};

function computeActiveStep(
  status: string,
  profilePhotoUrl?: string | null,
  roomPhotoUrls?: string[] | null,
): number {
  const dossierComplet = !!profilePhotoUrl && (roomPhotoUrls?.length ?? 0) > 0;
  const effectiveStatus = status === 'enrichment_pending' && !dossierComplet ? 'pre_approved' : status;
  return STATUS_TO_STEP[effectiveStatus] ?? 1;
}

describe('StatusTimeline — garde dossier complet pour enrichment_pending', () => {
  it('enrichment_pending avec dossier complet → étape 3 ("Profil enrichi")', () => {
    const step = computeActiveStep('enrichment_pending', 'photo.webp', ['lieu1.webp']);
    expect(step).toBe(3);
  });

  it('régression : enrichment_pending SANS aucune photo (donnée hors flux API) → retombe à l\'étape 2, pas 3', () => {
    const step = computeActiveStep('enrichment_pending', null, null);
    expect(step).toBe(2);
  });

  it('régression : enrichment_pending avec photo profil mais room_photo_urls vide → étape 2', () => {
    const step = computeActiveStep('enrichment_pending', 'photo.webp', []);
    expect(step).toBe(2);
  });

  it('régression : enrichment_pending avec room photos mais sans photo de profil → étape 2', () => {
    const step = computeActiveStep('enrichment_pending', null, ['lieu1.webp']);
    expect(step).toBe(2);
  });

  it('statuts non enrichment_pending ne sont jamais affectés par la garde (ex: validated)', () => {
    const step = computeActiveStep('validated', null, null);
    expect(step).toBe(4);
  });

  it('pending_review reste étape 1 indépendamment des photos', () => {
    const step = computeActiveStep('pending_review', 'photo.webp', ['lieu1.webp']);
    expect(step).toBe(1);
  });
});
