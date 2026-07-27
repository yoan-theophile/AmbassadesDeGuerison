import { describe, it, expect } from 'vitest';
import { haversineKm } from '@/lib/geo/distance';

describe('haversineKm', () => {
  it('retourne 0 pour deux points identiques', () => {
    expect(haversineKm(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
  });

  it('calcule ~343km entre Paris et Lyon (arrondi au km)', () => {
    // Paris (48.8566, 2.3522) → Lyon (45.7640, 4.8357), distance réelle ~392km
    // vol d'oiseau — tolérance large car on vérifie l'ordre de grandeur, pas
    // une valeur exacte au mètre près (l'arrondi grossier est voulu).
    const d = haversineKm(48.8566, 2.3522, 45.7640, 4.8357);
    expect(d).toBeGreaterThan(380);
    expect(d).toBeLessThan(410);
  });

  it('retourne toujours un entier (jamais de décimale)', () => {
    const d = haversineKm(48.86, 2.35, 48.87, 2.36);
    expect(Number.isInteger(d)).toBe(true);
  });

  it('est symétrique (A→B == B→A)', () => {
    const a = haversineKm(48.8566, 2.3522, 45.7640, 4.8357);
    const b = haversineKm(45.7640, 4.8357, 48.8566, 2.3522);
    expect(a).toBe(b);
  });
});
