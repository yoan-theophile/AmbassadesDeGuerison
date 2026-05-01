import { describe, it, expect, beforeEach } from 'vitest';

// Logique de rate limiting extraite du middleware
// Store en mémoire : Map<ip, { count, resetAt }>

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

function createRateLimiter(max: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();

  return function check(ip: string, now: number): { allowed: boolean; remaining: number } {
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: max - 1 };
    }

    if (entry.count >= max) {
      return { allowed: false, remaining: 0 };
    }

    entry.count += 1;
    return { allowed: true, remaining: max - entry.count };
  };
}

describe('Rate limiter — logique de base', () => {
  let limiter: ReturnType<typeof createRateLimiter>;
  const now = Date.now();

  beforeEach(() => {
    limiter = createRateLimiter(3, 60_000);
  });

  it('autorise les premières N requêtes', () => {
    expect(limiter('1.2.3.4', now).allowed).toBe(true);
    expect(limiter('1.2.3.4', now).allowed).toBe(true);
    expect(limiter('1.2.3.4', now).allowed).toBe(true);
  });

  it('bloque la N+1e requête', () => {
    limiter('1.2.3.4', now);
    limiter('1.2.3.4', now);
    limiter('1.2.3.4', now);
    expect(limiter('1.2.3.4', now).allowed).toBe(false);
  });

  it('isole les IPs différentes', () => {
    limiter('1.2.3.4', now);
    limiter('1.2.3.4', now);
    limiter('1.2.3.4', now);
    // IP différente — doit passer
    expect(limiter('5.6.7.8', now).allowed).toBe(true);
  });

  it('réinitialise après la fenêtre de temps', () => {
    limiter('1.2.3.4', now);
    limiter('1.2.3.4', now);
    limiter('1.2.3.4', now);
    limiter('1.2.3.4', now); // bloqué

    // Après la fenêtre
    const later = now + 61_000;
    expect(limiter('1.2.3.4', later).allowed).toBe(true);
  });

  it('retourne le bon nombre de requêtes restantes', () => {
    const r1 = limiter('1.2.3.4', now);
    expect(r1.remaining).toBe(2);
    const r2 = limiter('1.2.3.4', now);
    expect(r2.remaining).toBe(1);
    const r3 = limiter('1.2.3.4', now);
    expect(r3.remaining).toBe(0);
  });
});

describe('Rate limiter — différentes limites par route', () => {
  const LIMITS: Record<string, { max: number; windowMs: number }> = {
    '/api/inscriptions':          { max: 2, windowMs: 60_000 },
    '/api/temoignages':           { max: 3, windowMs: 60_000 },
    '/api/visitor-help-request':  { max: 3, windowMs: 60_000 },
  };

  it('inscriptions limité à 2 requêtes par minute', () => {
    const limiter = createRateLimiter(
      LIMITS['/api/inscriptions'].max,
      LIMITS['/api/inscriptions'].windowMs,
    );
    const now = Date.now();
    expect(limiter('ip', now).allowed).toBe(true);
    expect(limiter('ip', now).allowed).toBe(true);
    expect(limiter('ip', now).allowed).toBe(false);
  });

  it('temoignages limité à 3 requêtes par minute', () => {
    const limiter = createRateLimiter(
      LIMITS['/api/temoignages'].max,
      LIMITS['/api/temoignages'].windowMs,
    );
    const now = Date.now();
    limiter('ip', now);
    limiter('ip', now);
    limiter('ip', now);
    expect(limiter('ip', now).allowed).toBe(false);
  });
});
