/**
 * middleware.ts — Next.js Edge Middleware for route protection.
 *
 * PROTECTED ROUTES
 * ─────────────────────────────────────────────────────────────────
 * /admin/*         → role must be "admin"   → else → /admin/login
 * /student/*       → role must be student_* → else → /login
 *
 * STRATEGY
 * ─────────────────────────────────────────────────────────────────
 * The app uses an in-memory access token + HttpOnly refresh cookie.
 * The middleware cannot read the in-memory token (it lives in the
 * browser), so we forward the refresh cookie to the backend's
 * /auth/refresh endpoint and inspect the role claim in the returned
 * access token (JWT is a plain HS256 token — we decode its payload
 * on the edge without a full verify, trusting the backend already
 * validated the refresh cookie before issuing it).
 *
 * WHY NOT FULL VERIFY ON THE EDGE?
 * The JWT secret would need to be an env var accessible to the Edge
 * Runtime.  That's viable but adds coupling.  Instead, we treat a
 * successful /refresh response (200 + access_token) as proof of a
 * valid session, and read the unverified payload only for the role
 * claim.  This is safe because:
 *   • The backend already validated the refresh cookie.
 *   • Even if an attacker forged the JWT payload client-side, the
 *     actual API calls in the admin pages hit backend endpoints
 *     that re-verify the token with AdminDep.
 *
 * TL;DR: Middleware prevents casual URL-guessing; backend enforces
 * real security on every request.
 */

import { type NextRequest, NextResponse } from 'next/server';

const REFRESH_COOKIE = 'refresh_token';

// ── JWT payload decoder (no signature verify — see comment above) ──────────

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

// ── Refresh helper ─────────────────────────────────────────────────────────

interface RefreshResult {
  role: string | null;
  error: boolean;
}

async function tryRefresh(request: NextRequest): Promise<RefreshResult> {
  const refreshCookie = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshCookie) {
    // No cookie on the frontend domain — session definitely not established
    return { role: null, error: false };
  }

  try {
    // Call the same-domain Next.js proxy rather than the backend directly.
    // The proxy reads the frontend-domain refresh_token cookie and forwards
    // it to the backend — this is what makes cross-domain deployments work.
    const proxyUrl = new URL('/api/auth/refresh', request.url);
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        // Forward the cookie so the proxy route can read it server-side
        Cookie: `${REFRESH_COOKIE}=${refreshCookie}`,
      },
    });

    if (!res.ok) return { role: null, error: true };

    const body = (await res.json()) as { access_token?: string; role?: string };

    // Backend returns role in the response body — prefer that, fall back to JWT
    if (body.role) return { role: body.role, error: false };

    if (body.access_token) {
      const payload = decodeJwtPayload(body.access_token);
      const role = (payload?.role as string) ?? null;
      return { role, error: false };
    }

    return { role: null, error: true };
  } catch {
    // Network error — fail open; the page's own API calls will 401 them.
    return { role: null, error: true };
  }
}

// ── Main middleware ────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Guard: /admin/* (except the login page itself) ─────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const { role, error } = await tryRefresh(request);

    if (!role && !error) {
      // No frontend-domain cookie at all → send to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (error) {
      // Backend unreachable — fail open; the page's API calls will 401 if invalid.
      return NextResponse.next();
    }

    if (role !== 'admin') {
      // Authenticated, but wrong role (e.g. a student guessing the URL)
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('hint', 'not_admin');
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated admin — let the request through
    return NextResponse.next();
  }

  // ── Guard: /student/* ───────────────────────────────────────────────────
  if (pathname.startsWith('/student')) {
    const { role, error } = await tryRefresh(request);

    if (!role && !error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (error) {
      // Backend down — pass through; the page's own fetch will 401
      return NextResponse.next();
    }

    if (!role || !role.startsWith('student')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// ── Matcher ────────────────────────────────────────────────────────────────
// Only run middleware on pages that need protection.
// Exclude static assets, _next internals, and public files.

export const config = {
  matcher: [
    '/admin/:path*',
    '/student/:path*',
  ],
};
