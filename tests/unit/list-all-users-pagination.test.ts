import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { listAllAuthUsers, getAuthUsersByEmail, getAuthEmailsById } from '@/lib/auth/list-all-users';

// Régression : `supabase.auth.admin.listUsers()` sans argument s'arrête à 50
// comptes, silencieusement — aucune erreur, aucun indicateur de troncature.
// Avec 78 comptes en base, /admin/team affichait « Inconnu » à la place des
// deux super admins (créés en premier, donc au-delà de la première page).
//
// Le même défaut touchait des chemins plus sensibles :
//   - classify-email classait 'new' une adresse déjà prise → collision non
//     détectée à la création de compte visiteur
//   - inscriptions ne retrouvait pas le compte après « already registered »
//     → profil ambassadeur créé orphelin, sans compte auth rattaché
//
// Trouvé le 2026-08-07 en vérifiant l'audit admin dans le navigateur.

const PER_PAGE = 1000; // doit rester aligné sur lib/auth/list-all-users.ts

function makeUser(i: number) {
  return { id: `user-${i}`, email: `user${i}@example.com`, user_metadata: {} };
}

/**
 * Faux `listUsers` fidèle au comportement observé sur l'API Supabase :
 * pages 1-indexées, tranche de `perPage`, page vide au-delà du dernier compte.
 */
function makeSupabaseMock(totalUsers: number) {
  const all = Array.from({ length: totalUsers }, (_, i) => makeUser(i));
  const listUsers = vi.fn(async ({ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}) => {
    const start = (page - 1) * perPage;
    return { data: { users: all.slice(start, start + perPage) }, error: null };
  });
  return {
    client: { auth: { admin: { listUsers } } } as unknown as SupabaseClient,
    listUsers,
    all,
  };
}

describe('listAllAuthUsers()', () => {
  it('remonte tous les comptes au-delà de la page par défaut de 50', async () => {
    const { client } = makeSupabaseMock(78);
    const users = await listAllAuthUsers(client);

    expect(users).toHaveLength(78);
    // Le compte qui manquait en production : au-delà du 50e.
    expect(users.map((u) => u.id)).toContain('user-77');
  });

  it('demande explicitement un perPage — un appel nu tronquerait à 50', async () => {
    const { client, listUsers } = makeSupabaseMock(78);
    await listAllAuthUsers(client);

    for (const call of listUsers.mock.calls) {
      expect(call[0]?.perPage).toBe(PER_PAGE);
    }
  });

  it('un seul appel suffit quand la première page n\'est pas pleine', async () => {
    const { client, listUsers } = makeSupabaseMock(78);
    await listAllAuthUsers(client);

    // 78 < perPage → la boucle doit s'arrêter immédiatement, pas sonder page 2.
    expect(listUsers).toHaveBeenCalledTimes(1);
  });

  it('enchaîne les pages quand la première est pleine', async () => {
    const { client, listUsers } = makeSupabaseMock(PER_PAGE * 2 + 5);
    const users = await listAllAuthUsers(client);

    expect(users).toHaveLength(PER_PAGE * 2 + 5);
    expect(listUsers).toHaveBeenCalledTimes(3);
    expect(listUsers.mock.calls.map((c) => c[0]?.page)).toEqual([1, 2, 3]);
  });

  it("s'arrête sur un total exactement multiple de perPage (pas de boucle infinie)", async () => {
    const { client, listUsers } = makeSupabaseMock(PER_PAGE);
    const users = await listAllAuthUsers(client);

    // Page 1 pleine → une page 2 est demandée, revient vide, on s'arrête.
    expect(users).toHaveLength(PER_PAGE);
    expect(listUsers).toHaveBeenCalledTimes(2);
  });

  it('base vide → tableau vide, un seul appel', async () => {
    const { client, listUsers } = makeSupabaseMock(0);
    expect(await listAllAuthUsers(client)).toEqual([]);
    expect(listUsers).toHaveBeenCalledTimes(1);
  });

  it('propage une erreur API au lieu de retourner une liste tronquée', async () => {
    const listUsers = vi.fn().mockResolvedValue({ data: null, error: { message: 'rate limited' } });
    const client = { auth: { admin: { listUsers } } } as unknown as SupabaseClient;

    // Avaler l'erreur rendrait une liste partielle indiscernable d'une liste
    // complète — exactement le défaut qu'on corrige.
    await expect(listAllAuthUsers(client)).rejects.toMatchObject({ message: 'rate limited' });
  });
});

describe('index dérivés', () => {
  it('getAuthUsersByEmail indexe en minuscules, y compris au-delà de 50', async () => {
    const { client } = makeSupabaseMock(78);
    const byEmail = await getAuthUsersByEmail(client);

    expect(byEmail.get('user77@example.com')?.id).toBe('user-77');
    expect(byEmail.size).toBe(78);
  });

  it('getAuthUsersByEmail retrouve une adresse saisie avec une casse différente', async () => {
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [{ id: 'u1', email: 'Camille.Petit@Demo.FR', user_metadata: {} }] },
      error: null,
    });
    const client = { auth: { admin: { listUsers } } } as unknown as SupabaseClient;

    const byEmail = await getAuthUsersByEmail(client);
    expect(byEmail.get('camille.petit@demo.fr')?.id).toBe('u1');
  });

  it('getAuthUsersByEmail ignore les comptes sans e-mail (auth par téléphone)', async () => {
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [{ id: 'u1', email: null, user_metadata: {} }, { id: 'u2', email: 'a@b.fr', user_metadata: {} }] },
      error: null,
    });
    const client = { auth: { admin: { listUsers } } } as unknown as SupabaseClient;

    const byEmail = await getAuthUsersByEmail(client);
    expect(byEmail.size).toBe(1);
    expect(byEmail.get('a@b.fr')?.id).toBe('u2');
  });

  it('getAuthEmailsById résout un compte au-delà de la première page', async () => {
    const { client } = makeSupabaseMock(78);
    const byId = await getAuthEmailsById(client);

    // Le cas exact de /admin/team : « Inconnu » au lieu de l'e-mail.
    expect(byId.get('user-77')).toBe('user77@example.com');
    expect(byId.size).toBe(78);
  });
});
