/**
 * middleware.ts — Next.js Edge Middleware for route protection.
 *
 * PUBLIC ENTRY ROUTES
 * ─────────────────────────────────────────────────────────────────
 * /login          → Individual student login ("I bought my own access code")
 * /join           → School-issued code entry ("My school gave me a code")
 * /admin/login    → School administrator login
 *
 * PROTECTED ROUTES
 * ─────────────────────────────────────────────────────────────────
 * /admin/*         → role must be "admin"   → else → /admin/login
 * /student/*       → role must be student_* → else → /login
 *
 * FAST EDGE VERIFICATION
 * ─────────────────────────────────────────────────────────────────
 * The refresh_token cookie is an HS256 JWT issued by the backend containing
 * { sub, role, exp, type: "refresh" }. The Edge runtime decodes the unverified
 * payload to extract the role and expiration in 0ms (no blocking network calls).
 * Actual API endpoints re-verify signatures server-side.
 */

import { type NextRequest, NextResponse } from 'next/server';

const REFRESH_COOKIE = 'refresh_token';

// ── JWT payload decoder ───────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payloadB64Url] = token.split('.');
    if (!payloadB64Url) return null;
    const base64 = payloadB64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payloadB64Url.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── In-memory Edge Session Check (0ms latency) ────────────────────────────

function getSessionRoleFast(request: NextRequest): {
  role: string | null;
  isExpired: boolean;
  hasCookie: boolean;
} {
  const refreshCookie = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshCookie) {
    return { role: null, isExpired: false, hasCookie: false };
  }

  const payload = decodeJwtPayload(refreshCookie);
  if (!payload) {
    return { role: null, isExpired: true, hasCookie: true };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === 'number' ? payload.exp : 0;
  if (exp && exp < nowSec) {
    return { role: null, isExpired: true, hasCookie: true };
  }

  const role = typeof payload.role === 'string' ? payload.role : null;
  return { role, isExpired: false, hasCookie: true };
}

// ── Fallback network refresh (only if JWT payload has no role claim) ──────

interface RefreshResult {
  role: string | null;
  error: boolean;
}

async function tryRefresh(request: NextRequest): Promise<RefreshResult> {
  const refreshCookie = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshCookie) {
    return { role: null, error: false };
  }

  try {
    const proxyUrl = new URL('/api/auth/refresh', request.url);
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        Cookie: `${REFRESH_COOKIE}=${refreshCookie}`,
      },
    });

    if (!res.ok) return { role: null, error: true };

    const body = (await res.json()) as { access_token?: string; role?: string };

    if (body.role) return { role: body.role, error: false };

    if (body.access_token) {
      const payload = decodeJwtPayload(body.access_token);
      const role = (payload?.role as string) ?? null;
      return { role, error: false };
    }

    return { role: null, error: true };
  } catch {
    return { role: null, error: true };
  }
}

// ── Main middleware ────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Fast in-memory Edge decode (0ms latency, eliminates blocking subrequests on every route change)
  const session = getSessionRoleFast(request);

  if (!session.hasCookie || session.isExpired) {
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith('/student')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. Fast-path: role verified directly from the active session JWT
  if (session.role) {
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      if (session.role !== 'admin') {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('hint', 'not_admin');
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    if (pathname.startsWith('/student')) {
      if (!session.role.startsWith('student')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }
  }

  // 3. Fallback: network refresh only if role claim was missing in the payload
  const { role, error } = await tryRefresh(request);

  if (!role && !error) {
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith('/student')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (error) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && role !== 'admin') {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('hint', 'not_admin');
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/student') && (!role || !role.startsWith('student'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// ── Matcher ────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/admin/:path*',
    '/student/:path*',
  ],
};
