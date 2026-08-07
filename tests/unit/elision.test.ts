import { describe, it, expect } from 'vitest';
import { de } from '@/lib/elision';

// Regression: l'app affichait « Ambassade de Alpha », « de Antoine », « de Étienne »
// sur la fiche publique d'un ambassadeur, la page de feedback, la page de
// confirmation visiteur et la modération admin — le prénom vient d'une saisie
// libre, la forme ne pouvait pas être figée dans le texte.
// Found by /qa on 2026-08-07.

describe('de()', () => {
  it('élide devant une voyelle', () => {
    expect(de('Alpha')).toBe("d'Alpha");
    expect(de('Antoine')).toBe("d'Antoine");
    expect(de('Émilie')).toBe("d'Émilie");
    expect(de('Oumar')).toBe("d'Oumar");
  });

  it('élide devant un h (cas usuel en français contemporain)', () => {
    expect(de('Hugo')).toBe("d'Hugo");
  });

  it("n'élide pas devant une consonne", () => {
    expect(de('Marie')).toBe('de Marie');
    expect(de('Jean-Pierre')).toBe('de Jean-Pierre');
    expect(de('Fatou')).toBe('de Fatou');
  });

  it('gère les accents en début de nom quelle que soit la casse', () => {
    expect(de('émilie')).toBe("d'émilie");
    expect(de('Ève')).toBe("d'Ève");
  });

  it('ignore les espaces parasites de la saisie libre', () => {
    expect(de('  Alpha  ')).toBe("d'Alpha");
    expect(de('  Marie ')).toBe('de Marie');
  });

  it('retombe sur « de » seul si le nom est vide — jamais de « d\' » orphelin', () => {
    expect(de('')).toBe('de');
    expect(de('   ')).toBe('de');
    expect(de(null)).toBe('de');
    expect(de(undefined)).toBe('de');
  });
});
