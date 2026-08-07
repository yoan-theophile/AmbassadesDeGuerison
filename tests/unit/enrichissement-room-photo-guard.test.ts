import { describe, it, expect } from 'vitest';

// Logique extraite de PATCH /api/ambassadeur/enrichissement (commit a3439f6) :
// la photo du lieu, jusqu'ici optionnelle, devient obligatoire côté API — pas
// seulement côté formulaire (app/dashboard/questionnaire/page.tsx). Sans la garde
// API, un appel direct à la route (ou un ancien client mis en cache) pouvait encore
// soumettre un dossier sans photo du lieu.

interface Profile {
  status: string;
  profile_photo_url: string | null;
  room_photo_urls: string[] | null;
}

function validateEnrichissementSubmit(profile: Profile): { ok: boolean; status: number; error?: string } {
  if (profile.status !== 'pre_approved') {
    return { ok: false, status: 403, error: 'Le questionnaire n\'est accessible que pour les candidats pré-approuvés' };
  }
  if (!profile.profile_photo_url) {
    return { ok: false, status: 400, error: 'Une photo de profil est requise pour soumettre votre profil.' };
  }
  if (!profile.room_photo_urls || profile.room_photo_urls.length === 0) {
    return { ok: false, status: 400, error: 'Au moins une photo du lieu d\'accueil est requise pour soumettre votre profil.' };
  }
  return { ok: true, status: 200 };
}

describe('PATCH /api/ambassadeur/enrichissement — garde photo du lieu obligatoire', () => {
  it('accepte un dossier complet (photo profil + ≥1 photo lieu)', () => {
    const r = validateEnrichissementSubmit({
      status: 'pre_approved',
      profile_photo_url: 'ambassador-photos/uuid/profil.webp',
      room_photo_urls: ['ambassador-photos/uuid/lieu1.webp'],
    });
    expect(r.ok).toBe(true);
  });

  it('rejette room_photo_urls vide — 400 (nouveau comportement, était accepté avant a3439f6)', () => {
    const r = validateEnrichissementSubmit({
      status: 'pre_approved',
      profile_photo_url: 'ambassador-photos/uuid/profil.webp',
      room_photo_urls: [],
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toContain('lieu');
  });

  it('rejette room_photo_urls null — 400', () => {
    const r = validateEnrichissementSubmit({
      status: 'pre_approved',
      profile_photo_url: 'ambassador-photos/uuid/profil.webp',
      room_photo_urls: null,
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it('rejette toujours profile_photo_url manquante en premier (ordre de vérification préservé)', () => {
    const r = validateEnrichissementSubmit({
      status: 'pre_approved',
      profile_photo_url: null,
      room_photo_urls: [],
    });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('profil');
  });

  it('rejette un statut non pre_approved avant même de vérifier les photos', () => {
    const r = validateEnrichissementSubmit({
      status: 'validated',
      profile_photo_url: null,
      room_photo_urls: null,
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(403);
  });
});
