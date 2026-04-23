import { describe, it, expect } from 'vitest';

// Logique de filtrage extraite de app/admin/ambassadeurs/page.tsx

interface Ambassadeur {
  first_name: string;
  email: string;
  city: string;
  country: string;
  status: string;
}

function matchesSearch(a: Ambassadeur, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    a.first_name.toLowerCase().includes(lower) ||
    a.email.toLowerCase().includes(lower) ||
    a.city.toLowerCase().includes(lower)
  );
}

function matchesStatus(a: Ambassadeur, status: string): boolean {
  if (status === 'all') return true;
  return a.status === status;
}

const FIXTURES: Ambassadeur[] = [
  { first_name: 'Marie', email: 'marie.dubois@demo.fr',  city: 'Paris',   country: 'France', status: 'active'             },
  { first_name: 'Jean',  email: 'jp.martin@demo.fr',     city: 'Lyon',    country: 'France', status: 'active'             },
  { first_name: 'Sophie',email: 'sophie.leroux@demo.fr', city: 'Bordeaux',country: 'France', status: 'pending_onboarding' },
];

describe('Ambassadeurs — filtre par recherche full text', () => {
  it('q vide retourne tous les ambassadeurs', () => {
    expect(FIXTURES.filter((a) => matchesSearch(a, ''))).toHaveLength(3);
  });

  it('recherche par prénom (first_name)', () => {
    const results = FIXTURES.filter((a) => matchesSearch(a, 'Marie'));
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe('Marie');
  });

  it('recherche par e-mail', () => {
    const results = FIXTURES.filter((a) => matchesSearch(a, 'jp.martin'));
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe('Jean');
  });

  it('recherche par ville', () => {
    const results = FIXTURES.filter((a) => matchesSearch(a, 'Bordeaux'));
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe('Sophie');
  });

  it('recherche insensible à la casse', () => {
    const results = FIXTURES.filter((a) => matchesSearch(a, 'marie'));
    expect(results).toHaveLength(1);
  });

  it('terme introuvable retourne tableau vide', () => {
    const results = FIXTURES.filter((a) => matchesSearch(a, 'zzz'));
    expect(results).toHaveLength(0);
  });
});

describe('Ambassadeurs — filtre par statut', () => {
  it('status=all retourne tout', () => {
    expect(FIXTURES.filter((a) => matchesStatus(a, 'all'))).toHaveLength(3);
  });

  it('status=active retourne les actifs uniquement', () => {
    const results = FIXTURES.filter((a) => matchesStatus(a, 'active'));
    expect(results).toHaveLength(2);
    results.forEach((a) => expect(a.status).toBe('active'));
  });

  it('status=pending_onboarding retourne les en attente uniquement', () => {
    const results = FIXTURES.filter((a) => matchesStatus(a, 'pending_onboarding'));
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe('Sophie');
  });

  it('status=suspended retourne vide si aucun suspendu', () => {
    const results = FIXTURES.filter((a) => matchesStatus(a, 'suspended'));
    expect(results).toHaveLength(0);
  });
});

describe('Ambassadeurs — combinaison recherche + statut', () => {
  it('filtre cumulatif : q=marie + status=active', () => {
    const results = FIXTURES
      .filter((a) => matchesSearch(a, 'marie'))
      .filter((a) => matchesStatus(a, 'active'));
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe('Marie');
  });

  it('filtre cumulatif : q=sophie + status=active → vide (Sophie est pending)', () => {
    const results = FIXTURES
      .filter((a) => matchesSearch(a, 'sophie'))
      .filter((a) => matchesStatus(a, 'active'));
    expect(results).toHaveLength(0);
  });
});
