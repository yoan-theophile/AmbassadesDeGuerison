import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ── Rate limiting — routes POST publiques ─────────────────────────────────────

const RATE_LIMITED_ROUTES = [
  '/api/visit-requests',
  '/api/feedbacks',
  '/api/temoignages',
  '/api/inscriptions',
  '/api/visitor-help-request',
  '/api/distance',
];

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/visit-requests':       { max: 3, windowMs: 60_000 },
  '/api/feedbacks':            { max: 5, windowMs: 60_000 },
  '/api/temoignages':          { max: 3, windowMs: 60_000 },
  '/api/inscriptions':         { max: 2, windowMs: 60_000 },
  '/api/visitor-help-request': { max: 3, windowMs: 60_000 },
  // Mitigation "oracle de position" (cf /plan-eng-review, Codex) : un visiteur
  // légitime clique "Trier par distance" une poignée de fois max par minute ;
  // un rate-limit serré rend la triangulation par requêtes répétées impraticable.
  '/api/distance':              { max: 8, windowMs: 60_000 },
};

// Stockage en mémoire (ne persiste pas entre instances serverless — suffisant pour démo)
const store = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, pathname: string): boolean {
  const matchedRoute = RATE_LIMITED_ROUTES.find(r => pathname.startsWith(r));
  if (!matchedRoute) return false;

  const limit = LIMITS[matchedRoute];
  const key = `${ip}:${matchedRoute}`;
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

// ── Proxy principal ───────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting sur les routes POST publiques
  if (request.method === 'POST' && RATE_LIMITED_ROUTES.some(r => pathname.startsWith(r))) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (isRateLimited(ip, pathname)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // Protection auth sur les routes admin
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    const role = user.user_metadata?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/visit-requests/:path*',
    '/api/feedbacks/:path*',
    '/api/temoignages/:path*',
    '/api/inscriptions/:path*',
    '/api/visitor-help-request/:path*',
    '/api/distance/:path*',
  ],
};
