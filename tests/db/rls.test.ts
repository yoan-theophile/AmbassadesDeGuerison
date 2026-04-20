/**
 * Tests d'intégration — RLS policies
 * Prérequis : supabase start (Docker local)
 */
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

const SUPABASE_URL = process.env.SUPABASE_LOCAL_URL ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_LOCAL_ANON_KEY ?? 'your-local-anon-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? 'your-local-service-key';

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

describe('RLS — events', () => {
  it('lecture publique sans auth', async () => {
    const { error } = await anonClient.from('events').select('id').limit(1);
    expect(error).toBeNull();
  });
});

describe('RLS — host_profiles', () => {
  it('un visiteur anon ne voit que les hôtes actifs', async () => {
    const { data } = await anonClient.from('host_profiles').select('id, status');
    const allActive = (data ?? []).every((h) => h.status === 'active');
    expect(allActive).toBe(true);
  });

  it('un visiteur anon ne voit pas address_private', async () => {
    const { error } = await anonClient
      .from('host_profiles')
      .select('address_private')
      .limit(1);
    // L'accès à address_private via anon doit être bloqué par RLS
    // (la view host_profiles_public exclut cette colonne)
    expect(error).not.toBeNull();
  });
});

describe('RLS — contact_requests', () => {
  it('insert public sans auth', async () => {
    // On vérifie juste que la policy public_insert existe (FK violation = policy OK)
    const { error } = await anonClient
      .from('contact_requests')
      .insert({
        host_activation_id: '00000000-0000-0000-0000-000000000000',
        visitor_first_name: 'Test',
        visitor_email: 'test@test.com',
      });
    // FK violation = policy OK, mais l'activation n'existe pas
    expect(error?.code).toBe('23503'); // foreign_key_violation
  });
});

describe('RLS — live_signals', () => {
  it('un visiteur anon ne peut pas lire les signaux', async () => {
    const { data, error } = await anonClient.from('live_signals').select('id').limit(1);
    // Sans auth, RLS doit bloquer (0 résultats ou erreur)
    expect(data?.length ?? 0).toBe(0);
  });
});
