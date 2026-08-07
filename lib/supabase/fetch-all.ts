// PostgREST plafonne les SELECT à 1000 lignes par défaut sur Supabase, et la
// troncature est silencieuse : pas d'erreur, pas d'indicateur, juste un
// tableau incomplet indiscernable d'un tableau complet.
//
// Contexte (2026-08-07) : le même défaut sur `auth.admin.listUsers()` (limite
// 50) avait déjà produit un bug visible en production de démo — des admins
// affichés « Inconnu ». La version SQL du problème est plus dangereuse, parce
// qu'elle ne se voit pas à l'écran : une campagne partirait à 1000
// ambassadeurs sur 1200 sans que rien ne le signale.
//
// À utiliser pour toute lecture dont le volume croît avec l'usage et dont
// l'exhaustivité compte (envois, snapshots, exports). Inutile pour les
// requêtes déjà bornées par `.limit()`, `.single()` ou un filtre sur un id.

const PAGE_SIZE = 1000;

/**
 * Rejoue la requête en pages de 1000 jusqu'à épuisement.
 *
 * `makeQuery` doit construire une requête *non exécutée* et **sans `.range()`**
 * — la fonction pose le sien. Le builder PostgREST est thenable (un `await`
 * l'exécute), d'où la factory : on en fabrique un neuf à chaque tour au lieu
 * de réutiliser un builder déjà consommé.
 *
 * **La requête doit porter un `.order()` sur une colonne stable.** Sans ordre
 * explicite, PostgreSQL ne garantit pas que deux pages successives voient les
 * lignes dans le même ordre : des lignes pourraient être vues deux fois et
 * d'autres jamais — un défaut plus insidieux que la troncature qu'on corrige.
 */
/**
 * Contrat minimal attendu du builder : savoir se borner et s'exécuter.
 *
 * On ne s'appuie volontairement pas sur `PostgrestFilterBuilder` : ses
 * paramètres génériques varient selon la table et la forme du `select()`, et
 * les réconcilier ici fait exploser l'inférence TypeScript (« Type
 * instantiation is excessively deep »). L'appelant annonce la forme des lignes
 * via `T`, comme il le ferait avec un cast sur le résultat d'un `await`.
 */
type RangeableQuery = {
  range: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>;
};

export async function fetchAllRows<T>(makeQuery: () => RangeableQuery): Promise<T[]> {
  const all: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await makeQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const batch = (data ?? []) as T[];
    all.push(...batch);

    if (batch.length < PAGE_SIZE) break;
  }

  return all;
}
