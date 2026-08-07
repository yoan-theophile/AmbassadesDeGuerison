import { describe, it, expect, vi } from 'vitest';
import { getUnsubscribedEmails } from '@/lib/campaigns/unsubscribed';

// Regression: le désabonnement était enregistré (campaign_recipients.status =
// 'unsubscribed' + contact_requests.visitor_notifications_optin = false) mais
// jamais relu — ni par le snapshot de POST /api/admin/campaigns, ni par le cron
// de dispatch. Un visiteur ayant cliqué "se désabonner" recevait donc la
// campagne suivante. Vérifié bout-en-bout via Mailhog le 2026-08-07.

function buildSupabaseMock(recipients: { email: string }[], contacts: { visitor_email: string }[]) {
  // fetchAllRows() rappelle la factory à chaque page et pose son propre
  // .range(from, to) — on découpe donc `rows` selon les bornes reçues, ce qui
  // termine naturellement la pagination (dernière page < PAGE_SIZE).
  const makeQuery = (rows: unknown[]) => {
    const q: Record<string, unknown> = {};
    q.select = vi.fn(() => q);
    q.eq = vi.fn(() => q);
    q.order = vi.fn(() => q);
    q.range = vi.fn((from: number, to: number) =>
      Promise.resolve({ data: rows.slice(from, to + 1), error: null })
    );
    return q;
  };

  return {
    from: vi.fn((table: string) => {
      if (table === 'campaign_recipients') return makeQuery(recipients);
      if (table === 'contact_requests') return makeQuery(contacts);
      throw new Error(`unexpected table ${table}`);
    }),
  } as never;
}

describe('getUnsubscribedEmails', () => {
  it('réunit les deux traces du désabonnement (campaign_recipients + contact_requests)', async () => {
    const supabase = buildSupabaseMock(
      [{ email: 'visiteur@example.com' }],
      [{ visitor_email: 'autre@example.com' }]
    );

    const set = await getUnsubscribedEmails(supabase);

    expect(set.has('visiteur@example.com')).toBe(true);
    expect(set.has('autre@example.com')).toBe(true);
  });

  it('normalise la casse — un désabonnement doit tenir quelle que soit la casse saisie', async () => {
    const supabase = buildSupabaseMock([{ email: 'Visiteur@Example.COM' }], []);

    const set = await getUnsubscribedEmails(supabase);

    expect(set.has('visiteur@example.com')).toBe(true);
  });

  it('ignore les lignes sans email plutôt que d\'insérer une entrée vide', async () => {
    const supabase = buildSupabaseMock(
      [{ email: '' }, { email: 'ok@example.com' }],
      [{ visitor_email: null as unknown as string }]
    );

    const set = await getUnsubscribedEmails(supabase);

    expect(set.has('')).toBe(false);
    expect(set.size).toBe(1);
    expect(set.has('ok@example.com')).toBe(true);
  });

  it('retourne un set vide quand personne ne s\'est désabonné', async () => {
    const set = await getUnsubscribedEmails(buildSupabaseMock([], []));
    expect(set.size).toBe(0);
  });
});
