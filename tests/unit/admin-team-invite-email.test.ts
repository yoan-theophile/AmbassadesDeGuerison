import { describe, it, expect, vi, beforeEach } from 'vitest';

// Régression : ajouter un membre à l'équipe admin utilisait
// `inviteUserByEmail`, qui délègue l'envoi au SMTP interne de Supabase. Cette
// couche ignore `USE_MAILHOG` et Resend : en local rien n'arrivait dans
// Mailhog, en prod l'e-mail aurait échappé aux logs Resend — dans les deux cas
// sans erreur, l'appel répondant 200 avec `invited_at` renseigné.
//
// Le lien produit portait en plus `type=invite`, que /auth/confirm ne sait pas
// vérifier (il n'accepte que 'magiclink' | 'email') : il aurait échoué même
// s'il était arrivé.
//
// Le projet évite déjà cette méthode ailleurs (cf app/api/inscriptions/route.ts)
// pour la même raison, plus son rate limit ~2-4/h.
// Trouvé par David le 2026-08-07 : « l'email n'a pas été envoyé ».

const sendMagicLink = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/email/templates', () => ({ sendMagicLink: (...a: unknown[]) => sendMagicLink(...a) }));

// `requireSuperAdmin` fournit le client Supabase à la route. On le remplace par
// un mock lu au moment de l'appel (pas à la définition), pour que chaque test
// puisse installer le sien via `setSupabase()`.
let currentSupabase: ReturnType<typeof buildSupabaseMock>;
function setSupabase(mock: ReturnType<typeof buildSupabaseMock>) {
  currentSupabase = mock;
}

vi.mock('@/lib/auth/require-admin', () => ({
  requireSuperAdmin: async () => ({
    user: { id: 'super-admin-1' },
    supabase: currentSupabase,
  }),
}));

const HASHED_TOKEN = 'hashed-token-abc';

function buildSupabaseMock({ existingUser = null }: { existingUser?: { id: string; email: string; user_metadata: Record<string, unknown> } | null } = {}) {
  const createUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'new-user-1', email: 'camille@example.com', user_metadata: {} } },
    error: null,
  });
  const inviteUserByEmail = vi.fn().mockResolvedValue({
    data: { user: { id: 'new-user-1', user_metadata: {} } },
    error: null,
  });
  const generateLink = vi.fn().mockResolvedValue({
    data: { properties: { hashed_token: HASHED_TOKEN } },
    error: null,
  });
  const listUsers = vi.fn().mockResolvedValue({
    data: { users: existingUser ? [existingUser] : [] },
    error: null,
  });
  const updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });

  const upsert = vi.fn().mockResolvedValue({ error: null });
  const insert = vi.fn().mockResolvedValue({ error: null });

  return {
    auth: { admin: { createUser, inviteUserByEmail, generateLink, listUsers, updateUserById } },
    from: vi.fn(() => ({ upsert, insert })),
    __mocks: { createUser, inviteUserByEmail, generateLink, listUsers, updateUserById, upsert, insert },
  };
}

async function postTeam(body: Record<string, unknown>) {
  const { POST } = await import('@/app/api/admin/team/route');
  const req = new Request('http://localhost/api/admin/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(req as unknown as import('next/server').NextRequest);
}

describe('POST /api/admin/team — envoi du lien de connexion', () => {
  beforeEach(() => {
    vi.resetModules();
    sendMagicLink.mockClear();
    sendMagicLink.mockResolvedValue(undefined);
  });

  it("envoie le lien via la couche e-mail du projet, jamais via le SMTP Supabase", async () => {
    const mock = buildSupabaseMock();
    setSupabase(mock);

    const res = await postTeam({ email: 'camille@example.com', role: 'admin' });
    expect(res.status).toBe(201);

    // Le cœur de la régression : passer par inviteUserByEmail contourne
    // Mailhog/Resend et rend l'envoi invisible.
    expect(mock.__mocks.inviteUserByEmail).not.toHaveBeenCalled();
    expect(sendMagicLink).toHaveBeenCalledTimes(1);
  });

  it('crée le compte sans déclencher le mail de confirmation Supabase', async () => {
    const mock = buildSupabaseMock();
    setSupabase(mock);

    await postTeam({ email: 'camille@example.com', role: 'admin' });

    expect(mock.__mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'camille@example.com', email_confirm: true })
    );
  });

  it("produit un lien type=magiclink que /auth/confirm sait vérifier", async () => {
    const mock = buildSupabaseMock();
    setSupabase(mock);

    await postTeam({ email: 'camille@example.com', role: 'admin' });

    expect(mock.__mocks.generateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'magiclink', email: 'camille@example.com' })
    );

    const [, url] = sendMagicLink.mock.calls[0] as [string, string];
    expect(url).toContain('/auth/confirm');
    expect(url).toContain(`token_hash=${HASHED_TOKEN}`);
    expect(url).toContain('type=magiclink');
    // Un lien 'invite' aurait échoué sur cette page.
    expect(url).not.toContain('type=invite');
  });

  it('envoie aussi le lien à un compte déjà existant qui reçoit l\'accès', async () => {
    const mock = buildSupabaseMock({
      existingUser: { id: 'existing-1', email: 'deja@example.com', user_metadata: { role: 'visitor' } },
    });
    setSupabase(mock);

    const res = await postTeam({ email: 'deja@example.com', role: 'admin' });
    const body = await res.json();

    expect(mock.__mocks.createUser).not.toHaveBeenCalled();
    expect(body.invited).toBe(false);
    // Sans lien, la personne ne saurait pas qu'elle a désormais un accès admin.
    expect(sendMagicLink).toHaveBeenCalledTimes(1);
  });

  it("accorde quand même l'accès si l'envoi échoue, et le signale au client", async () => {
    const mock = buildSupabaseMock();
    setSupabase(mock);
    sendMagicLink.mockRejectedValue(new Error('SMTP down'));

    const res = await postTeam({ email: 'camille@example.com', role: 'admin' });
    const body = await res.json();

    // L'accès est déjà en base : répondre 500 ferait croire à un échec total
    // et pousserait à re-tenter un ajout déjà effectué.
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.emailSent).toBe(false);
    expect(mock.__mocks.upsert).toHaveBeenCalled();
  });

  it('normalise la casse de l\'adresse avant création et envoi', async () => {
    const mock = buildSupabaseMock();
    setSupabase(mock);

    await postTeam({ email: '  Camille.Petit@Example.COM  ', role: 'admin' });

    expect(mock.__mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'camille.petit@example.com' })
    );
    expect(sendMagicLink.mock.calls[0][0]).toBe('camille.petit@example.com');
  });
});
