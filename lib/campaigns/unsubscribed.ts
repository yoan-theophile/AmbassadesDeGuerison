import type { createServiceClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/fetch-all';

type Client = ReturnType<typeof createServiceClient>;

/**
 * Emails qui se sont désabonnés des campagnes.
 *
 * Le désabonnement (`GET /api/unsubscribe/[token]`) écrit deux traces :
 *  1. `campaign_recipients.status = 'unsubscribed'` sur la ligne cliquée ;
 *  2. `contact_requests.visitor_notifications_optin = false` sur toutes les
 *     demandes de ce visiteur.
 *
 * Aucune des deux n'était consultée au moment de construire le snapshot d'une
 * campagne — un visiteur désabonné recevait donc quand même l'envoi suivant
 * (constaté en test bout-en-bout le 2026-08-07). Les deux sources sont lues
 * ici plutôt qu'une seule : (1) couvre les ambassadeurs, qui n'ont pas de
 * ligne dans `contact_requests`, et (2) couvre un visiteur dont la ligne de
 * campagne aurait été purgée avec une campagne annulée.
 *
 * Retourne un Set d'emails en minuscules — comparer avec `.toLowerCase()`.
 */
export async function getUnsubscribedEmails(supabase: Client): Promise<Set<string>> {
  const [recipients, contacts] = await Promise.all([
    fetchAllRows<{ email: string }>(() =>
      supabase
        .from('campaign_recipients')
        .select('email')
        .eq('status', 'unsubscribed')
        .order('id', { ascending: true })
    ),
    fetchAllRows<{ visitor_email: string }>(() =>
      supabase
        .from('contact_requests')
        .select('visitor_email')
        .eq('visitor_notifications_optin', false)
        .order('id', { ascending: true })
    ),
  ]);

  const set = new Set<string>();
  for (const r of recipients) if (r.email) set.add(r.email.toLowerCase());
  for (const c of contacts) if (c.visitor_email) set.add(c.visitor_email.toLowerCase());
  return set;
}
