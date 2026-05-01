import { NextRequest, NextResponse } from 'next/server';

// Routes publiques à rate-limiter (POST uniquement)
const RATE_LIMITED_ROUTES = [
  '/api/visit-requests',
  '/api/feedbacks',
  '/api/temoignages',
  '/api/inscriptions',
  '/api/visitor-help-request',
];

// Limites : N requêtes par fenêtre de T ms
const LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/visit-requests':      { max: 3,  windowMs: 60_000 },
  '/api/feedbacks':           { max: 5,  windowMs: 60_000 },
  '/api/temoignages':         { max: 3,  windowMs: 60_000 },
  '/api/inscriptions':        { max: 2,  windowMs: 60_000 },
  '/api/visitor-help-request':{ max: 3,  windowMs: 60_000 },
};

// Stockage en mémoire (ne persiste pas entre instances serverless — suffisant pour démo)
const store = new Map<string, { count: number; resetAt: number }>();

function getKey(ip: string, path: string): string {
  // Normalise le path pour grouper /api/visit-requests/[token]/accept avec /api/visit-requests
  const base = RATE_LIMITED_ROUTES.find(r => path.startsWith(r)) ?? path;
  return `${ip}:${base}`;
}

function isRateLimited(ip: string, pathname: string): boolean {
  const matchedRoute = RATE_LIMITED_ROUTES.find(r => pathname.startsWith(r));
  if (!matchedRoute) return false;

  const limit = LIMITS[matchedRoute];
  const key = getKey(ip, matchedRoute);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + limit.windowMs });
    return false;
  }

  if (entry.count >= limit.max) return true;

  entry.count++;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Seules les requêtes POST vers des routes publiques
  if (req.method !== 'POST') return NextResponse.next();
  if (!RATE_LIMITED_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (isRateLimited(ip, pathname)) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez patienter.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/visit-requests/:path*',
    '/api/feedbacks/:path*',
    '/api/temoignages/:path*',
    '/api/inscriptions/:path*',
    '/api/visitor-help-request/:path*',
  ],
};
