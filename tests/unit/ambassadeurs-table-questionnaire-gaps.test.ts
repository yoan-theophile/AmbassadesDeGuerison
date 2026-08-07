import { describe, it, expect } from 'vitest';

// Logique extraite de components/AmbassadeursTable.tsx:questionnaireGaps() — signal
// rapide pour Camille ("2 manquants") sans déplier la ligne. Nouveau dans la refonte
// 511-lignes (commit 4de1711).

interface Ambassadeur {
  profile_photo_signed_url: string | null;
  room_photo_signed_urls: string[];
  parcours_spirituel: string | null;
}

function questionnaireGaps(a: Ambassadeur): string[] {
  const gaps: string[] = [];
  if (!a.profile_photo_signed_url) gaps.push('photo de profil manquante');
  if (a.room_photo_signed_urls.length === 0) gaps.push('photo du lieu manquante');
  if (!a.parcours_spirituel) gaps.push('parcours spirituel vide');
  return gaps;
}

describe('AmbassadeursTable — questionnaireGaps()', () => {
  it('dossier complet → aucun manquant', () => {
    const gaps = questionnaireGaps({
      profile_photo_signed_url: 'https://signed/profil.webp',
      room_photo_signed_urls: ['https://signed/lieu1.webp'],
      parcours_spirituel: 'Un long parcours...',
    });
    expect(gaps).toEqual([]);
  });

  it('signale la photo de profil manquante', () => {
    const gaps = questionnaireGaps({
      profile_photo_signed_url: null,
      room_photo_signed_urls: ['https://signed/lieu1.webp'],
      parcours_spirituel: 'texte',
    });
    expect(gaps).toContain('photo de profil manquante');
    expect(gaps).toHaveLength(1);
  });

  it('signale la photo du lieu manquante quand le tableau est vide', () => {
    const gaps = questionnaireGaps({
      profile_photo_signed_url: 'https://signed/profil.webp',
      room_photo_signed_urls: [],
      parcours_spirituel: 'texte',
    });
    expect(gaps).toContain('photo du lieu manquante');
  });

  it('signale un parcours spirituel vide (chaîne vide traitée comme absente)', () => {
    const gaps = questionnaireGaps({
      profile_photo_signed_url: 'https://signed/profil.webp',
      room_photo_signed_urls: ['https://signed/lieu1.webp'],
      parcours_spirituel: '',
    });
    expect(gaps).toContain('parcours spirituel vide');
  });

  it('accumule les trois manquants simultanément (données créées hors flux API)', () => {
    const gaps = questionnaireGaps({
      profile_photo_signed_url: null,
      room_photo_signed_urls: [],
      parcours_spirituel: null,
    });
    expect(gaps).toHaveLength(3);
  });
});
