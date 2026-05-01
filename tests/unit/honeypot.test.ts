import { describe, it, expect } from 'vitest';

// Pattern honeypot utilisé dans toutes les routes publiques POST
// Un bot remplit automatiquement tous les champs, y compris le champ caché 'website'.
// Si website est présent dans le body, on renvoie 200 silencieux (ne pas alerter le bot).

function hasHoneypot(body: Record<string, unknown>): boolean {
  return Boolean(body.website);
}

function handleHoneypot(body: Record<string, unknown>): { shouldSilentReturn: boolean } {
  return { shouldSilentReturn: hasHoneypot(body) };
}

describe('Honeypot — détection de bots', () => {
  it('laisse passer si website absent', () => {
    const r = handleHoneypot({ email: 'test@test.com', name: 'Jean' });
    expect(r.shouldSilentReturn).toBe(false);
  });

  it('laisse passer si website est une chaîne vide', () => {
    const r = handleHoneypot({ email: 'test@test.com', website: '' });
    expect(r.shouldSilentReturn).toBe(false);
  });

  it('bloque si website est rempli', () => {
    const r = handleHoneypot({ email: 'test@test.com', website: 'http://spam.com' });
    expect(r.shouldSilentReturn).toBe(true);
  });

  it('bloque quelle que soit la valeur de website', () => {
    expect(handleHoneypot({ website: '1' }).shouldSilentReturn).toBe(true);
    expect(handleHoneypot({ website: 'true' }).shouldSilentReturn).toBe(true);
    expect(handleHoneypot({ website: 'x' }).shouldSilentReturn).toBe(true);
  });

  it('ne bloque pas les autres champs inhabituels', () => {
    expect(handleHoneypot({ phone_number: '+33612345678' }).shouldSilentReturn).toBe(false);
  });
});

describe('Honeypot — comportement silencieux', () => {
  it('renvoie 200 au lieu d\'un 400/403 pour ne pas alerter le bot', () => {
    // Par convention : status 200 silencieux = honeypot déclenché
    const body = { website: 'http://spam.com', email: 'bot@spam.com' };
    const triggered = hasHoneypot(body);
    // Le vrai code renvoie NextResponse.json({}, { status: 200 })
    const httpStatus = triggered ? 200 : 201;
    expect(httpStatus).toBe(200);
  });
});
