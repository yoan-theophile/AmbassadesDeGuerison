import { describe, it, expect } from 'vitest';
import { questionnaireGaps } from '@/lib/admin/questionnaire-gaps';
import { isDossierComplet } from '@/lib/host-profile';

// Signal rapide pour Camille ("2 photos manquantes") sans déplier la ligne.
//
// La fonction vit dans lib/ et est importée ici. Auparavant ce test en
// réimplémentait une copie : le passage de `string[]` à
// `{blocking, informational}` (audit admin 2026-08-07) n'a fait échouer aucun
// test, alors que le contrat avait entièrement changé.

const COMPLET = {
  profile_photo_signed_url: 'https://signed/profil.webp',
  room_photo_signed_urls: ['https://signed/lieu1.webp'],
  parcours_spirituel: 'Un long parcours...',
};

describe('questionnaireGaps()', () => {
  it('dossier complet → aucun manquant', () => {
    expect(questionnaireGaps(COMPLET)).toEqual({ blocking: [], informational: [] });
  });

  it('classe la photo de profil manquante comme bloquante', () => {
    const gaps = questionnaireGaps({ ...COMPLET, profile_photo_signed_url: null });
    expect(gaps.blocking).toContain('photo de profil manquante');
    expect(gaps.informational).toEqual([]);
  });

  it('classe la photo du lieu manquante comme bloquante', () => {
    const gaps = questionnaireGaps({ ...COMPLET, room_photo_signed_urls: [] });
    expect(gaps.blocking).toContain('photo du lieu manquante');
  });

  // Le cœur de la correction : le parcours spirituel n'empêche pas de valider.
  // Le compter comme un manque au même titre que les photos affichait
  // « 1 manquant » sur un dossier que l'API accepte sans broncher.
  it('classe le parcours spirituel vide comme informatif, jamais bloquant', () => {
    const gaps = questionnaireGaps({ ...COMPLET, parcours_spirituel: '' });
    expect(gaps.blocking).toEqual([]);
    expect(gaps.informational).toContain('parcours spirituel non renseigné');
  });

  it('accumule les deux photos manquantes (données créées hors flux API)', () => {
    const gaps = questionnaireGaps({
      profile_photo_signed_url: null,
      room_photo_signed_urls: [],
      parcours_spirituel: null,
    });
    expect(gaps.blocking).toHaveLength(2);
    expect(gaps.informational).toHaveLength(1);
  });

  // Garde-fou d'alignement : l'admin désactive « Valider » sur `blocking`,
  // l'API refuse sur `isDossierComplet`. Les deux doivent toujours dire la
  // même chose, sinon l'UI proposerait une action que l'API rejette (ou
  // l'inverse, en bloquant un dossier valide).
  it("s'accorde avec isDossierComplet() sur toutes les combinaisons de photos", () => {
    for (const photo of [null, 'https://signed/p.webp']) {
      for (const room of [[], ['https://signed/l.webp']]) {
        const gaps = questionnaireGaps({
          profile_photo_signed_url: photo,
          room_photo_signed_urls: room,
          parcours_spirituel: null,
        });
        expect(gaps.blocking.length === 0).toBe(isDossierComplet(photo, room));
      }
    }
  });
});
