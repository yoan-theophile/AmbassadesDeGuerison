/**
 * Tests d'intégration — triggers PostgreSQL
 * Prérequis : supabase start (Docker local)
 *
 * Usage :
 *   supabase start
 *   npx vitest run tests/db/triggers.test.ts
 *   supabase stop
 */
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SUPABASE_URL = process.env.SUPABASE_LOCAL_URL ?? 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? 'your-local-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let testHostId: string;
let testEventId: string;

beforeAll(async () => {
  // Crée un hôte de test
  const { data: host } = await supabase
    .from('host_profiles')
    .insert({
      first_name: 'TestHost',
      email: `test-trigger-${Date.now()}@test.com`,
      host_type: 'individual',
      city: 'Paris',
      country: 'France',
      contact_mode: 'public',
      status: 'validated',
    })
    .select('id')
    .single();
  testHostId = host!.id;
});

afterAll(async () => {
  // Nettoyage
  if (testEventId) await supabase.from('events').delete().eq('id', testEventId);
  if (testHostId) await supabase.from('host_profiles').delete().eq('id', testHostId);
});

describe('fn_auto_activate_hosts_for_event', () => {
  it('crée une host_activation pour chaque hôte actif quand un event est inséré', async () => {
    const { data: event } = await supabase
      .from('events')
      .insert({
        title: 'Test Event Trigger',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single();
    testEventId = event!.id;

    // Le trigger doit avoir créé l'activation
    const { data: activation } = await supabase
      .from('host_activations')
      .select('id, is_active')
      .eq('host_profile_id', testHostId)
      .eq('event_id', testEventId)
      .single();

    expect(activation).toBeTruthy();
    expect(activation!.is_active).toBe(true);
  });
});

describe('fn_auto_activate_host_for_existing_events', () => {
  it('active un hôte pour les events futurs quand il passe à status=active', async () => {
    // Crée un hôte en pending_onboarding
    const { data: host } = await supabase
      .from('host_profiles')
      .insert({
        first_name: 'TestHost2',
        email: `test-trigger2-${Date.now()}@test.com`,
        host_type: 'individual',
        city: 'Lyon',
        country: 'France',
        contact_mode: 'public',
        status: 'pending_onboarding',
      })
      .select('id')
      .single();

    // Crée un event futur (doit déjà exister via testEventId)
    // Passe l'hôte à validated (nouveau cycle de statut v2)
    await supabase
      .from('host_profiles')
      .update({ status: 'validated' })
      .eq('id', host!.id);

    // Le trigger doit avoir créé l'activation pour les events futurs
    const { data: activation } = await supabase
      .from('host_activations')
      .select('id, is_active')
      .eq('host_profile_id', host!.id)
      .eq('event_id', testEventId)
      .single();

    expect(activation).toBeTruthy();
    expect(activation!.is_active).toBe(true);

    // Nettoyage
    await supabase.from('host_profiles').delete().eq('id', host!.id);
  });
});

describe('accept_contact_request (atomicité)', () => {
  it('ne dépasse pas la capacité lors d\'appels concurrents', async () => {
    // Crée une activation avec capacity=1
    const { data: activation } = await supabase
      .from('host_activations')
      .insert({
        host_profile_id: testHostId,
        event_id: testEventId,
        capacity: 1,
        accepted_count: 0,
        is_active: true,
      })
      .select('id')
      .single();

    // Crée 2 contact_requests
    const emails = [`visitor1-${Date.now()}@test.com`, `visitor2-${Date.now()}@test.com`];
    const requests = await Promise.all(
      emails.map((email) =>
        supabase
          .from('contact_requests')
          .insert({
            host_activation_id: activation!.id,
            visitor_first_name: 'Test',
            visitor_email: email,
          })
          .select('id')
          .single()
      )
    );

    const [r1, r2] = requests.map((r) => r.data!.id);

    // Appels concurrents
    const [res1, res2] = await Promise.all([
      supabase.rpc('accept_contact_request', { activation_id: activation!.id, request_id: r1 }),
      supabase.rpc('accept_contact_request', { activation_id: activation!.id, request_id: r2 }),
    ]);

    const results = [res1.data, res2.data];
    const successes = results.filter((r) => r?.success === true).length;
    const errors = results.filter((r) => r?.error === 'complet').length;

    expect(successes).toBe(1);
    expect(errors).toBe(1);

    // Nettoyage
    await supabase.from('host_activations').delete().eq('id', activation!.id);
  });
});
