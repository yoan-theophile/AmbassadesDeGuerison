import { describe, it, expect } from 'vitest';

// Logique extraite de POST /api/admin/ambassadeurs/[id]/status — garde-fou 'reactiver'
// (commit ab62970). Avant ce fix, ACTION_STATUS['reactiver'] === 'validated'
// inconditionnellement : réintégrer un candidat 'rejected' AVANT qu'il n'ait jamais
// rempli le questionnaire (aucune photo) produisait un ambassadeur 'validated' sans
// dossier — visible publiquement avec un profil incomplet, via un bouton UI standard
// ("Réintégrer"), sans le garde-fou qui protège 'validated_bypass'.
//
// Fix : 'reactiver' vérifie profile_photo_url + room_photo_urls avant de choisir
// entre 'validated' (dossier complet) et 'enrichment_pending' (dossier incomplet,
// sans email — rien à annoncer).
//
// IMPORTANT : tests/unit/ambassador-status-cycle.test.ts et
// tests/unit/admin-ambassadeur-action.test.ts modélisent encore
// ACTION_STATUS['reactiver'] = 'validated' sans condition — ces fichiers sont des
// simplifications qui ne couvrent plus le comportement réel de la route depuis ce
// commit. Ce fichier couvre spécifiquement la branche conditionnelle ajoutée.

interface Profile {
  status: 'suspended' | 'rejected' | string;
  profile_photo_url: string | null;
  room_photo_urls: string[] | null;
}

function resolveReactiverStatus(profile: Profile): { newStatus: string; sendsEmail: boolean } {
  const dossierComplet = !!profile.profile_photo_url && (profile.room_photo_urls?.length ?? 0) > 0;
  const newStatus = dossierComplet ? 'validated' : 'enrichment_pending';
  return { newStatus, sendsEmail: newStatus === 'validated' };
}

describe("reactiver — garde-fou dossier complet (régression corrigée ab62970)", () => {
  it('dossier complet (photo profil + ≥1 photo lieu) → validated + email', () => {
    const r = resolveReactiverStatus({
      status: 'suspended',
      profile_photo_url: 'ambassador-photos/uuid/profil.webp',
      room_photo_urls: ['ambassador-photos/uuid/lieu1.webp'],
    });
    expect(r.newStatus).toBe('validated');
    expect(r.sendsEmail).toBe(true);
  });

  it("régression : rejected sans AUCUNE photo (jamais rempli le questionnaire) → enrichment_pending, pas validated", () => {
    const r = resolveReactiverStatus({
      status: 'rejected',
      profile_photo_url: null,
      room_photo_urls: null,
    });
    expect(r.newStatus).toBe('enrichment_pending');
    expect(r.sendsEmail).toBe(false);
  });

  it('régression : photo de profil présente mais room_photo_urls vide → enrichment_pending', () => {
    const r = resolveReactiverStatus({
      status: 'rejected',
      profile_photo_url: 'ambassador-photos/uuid/profil.webp',
      room_photo_urls: [],
    });
    expect(r.newStatus).toBe('enrichment_pending');
    expect(r.sendsEmail).toBe(false);
  });

  it('régression : room_photo_urls rempli mais profile_photo_url NULL → enrichment_pending', () => {
    const r = resolveReactiverStatus({
      status: 'suspended',
      profile_photo_url: null,
      room_photo_urls: ['ambassador-photos/uuid/lieu1.webp'],
    });
    expect(r.newStatus).toBe('enrichment_pending');
    expect(r.sendsEmail).toBe(false);
  });

  it('dossier incomplet → aucun email envoyé (rien à annoncer)', () => {
    const r = resolveReactiverStatus({
      status: 'suspended',
      profile_photo_url: undefined as unknown as null,
      room_photo_urls: undefined as unknown as null,
    });
    expect(r.sendsEmail).toBe(false);
  });
});
