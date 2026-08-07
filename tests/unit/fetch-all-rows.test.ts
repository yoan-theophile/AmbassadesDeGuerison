import { describe, it, expect, vi } from 'vitest';
import { fetchAllRows } from '@/lib/supabase/fetch-all';

// PostgREST plafonne les SELECT à 1000 lignes par défaut sur Supabase, sans
// erreur ni indicateur de troncature. Le cas qui a motivé ce helper : le
// snapshot de destinataires d'une campagne. Au-delà de 1000 ambassadeurs
// validés, les suivants n'auraient jamais reçu leur lien d'activation — donc
// aucune présence sur la carte au prochain live — en silence.

const PAGE_SIZE = 1000; // doit rester aligné sur lib/supabase/fetch-all.ts

/** Faux builder : `.range(from, to)` renvoie la tranche demandée, bornes incluses. */
function makeQueryFactory(totalRows: number) {
  const all = Array.from({ length: totalRows }, (_, i) => ({ id: `row-${i}` }));
  const range = vi.fn(async (from: number, to: number) => ({
    data: all.slice(from, to + 1),
    error: null,
  }));
  return { makeQuery: () => ({ range }), range, all };
}

describe('fetchAllRows()', () => {
  it('remonte toutes les lignes au-delà du plafond de 1000', async () => {
    const { makeQuery } = makeQueryFactory(2500);
    const rows = await fetchAllRows<{ id: string }>(makeQuery);

    expect(rows).toHaveLength(2500);
    // La ligne qui serait perdue par une requête nue.
    expect(rows.map((r) => r.id)).toContain('row-2499');
  });

  it('demande des tranches contiguës, sans trou ni recouvrement', async () => {
    const { makeQuery, range } = makeQueryFactory(2500);
    await fetchAllRows(makeQuery);

    expect(range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it('préserve l\'ordre des lignes entre les pages', async () => {
    const { makeQuery, all } = makeQueryFactory(2500);
    const rows = await fetchAllRows<{ id: string }>(makeQuery);
    expect(rows).toEqual(all);
  });

  it('un seul appel quand la première page n\'est pas pleine', async () => {
    const { makeQuery, range } = makeQueryFactory(42);
    expect(await fetchAllRows(makeQuery)).toHaveLength(42);
    expect(range).toHaveBeenCalledTimes(1);
  });

  it("s'arrête sur un total exactement multiple de la page (pas de boucle infinie)", async () => {
    const { makeQuery, range } = makeQueryFactory(PAGE_SIZE);
    const rows = await fetchAllRows(makeQuery);

    // Page 1 pleine → une page 2 est demandée, revient vide, on s'arrête.
    expect(rows).toHaveLength(PAGE_SIZE);
    expect(range).toHaveBeenCalledTimes(2);
  });

  it('table vide → tableau vide', async () => {
    const { makeQuery, range } = makeQueryFactory(0);
    expect(await fetchAllRows(makeQuery)).toEqual([]);
    expect(range).toHaveBeenCalledTimes(1);
  });

  it('propage une erreur au lieu de retourner une liste tronquée', async () => {
    // Avaler l'erreur rendrait un envoi partiel indiscernable d'un envoi
    // complet — exactement le défaut qu'on corrige.
    const makeQuery = () => ({
      range: async () => ({ data: null, error: { message: 'statement timeout' } }),
    });
    await expect(fetchAllRows(makeQuery)).rejects.toMatchObject({ message: 'statement timeout' });
  });

  it('reconstruit le builder à chaque page (un builder PostgREST est à usage unique)', async () => {
    const { range } = makeQueryFactory(2500);
    const makeQuery = vi.fn(() => ({ range }));
    await fetchAllRows(makeQuery);

    // Réutiliser un builder déjà awaité rejouerait la même requête.
    expect(makeQuery).toHaveBeenCalledTimes(3);
  });
});
