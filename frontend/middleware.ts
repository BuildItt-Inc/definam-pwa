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

// Prefer the private server-side API_URL (not inlined at build time, always
// available in Edge Middleware). Fall back to the public variant so local dev
// still works out of the box without a separate variable.
const API_BASE =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  '';
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

async function tryRefresh(refreshCookie: string): Promise<RefreshResult> {
  // No API base configured — pass through and let the page's own fetch handle auth.
  if (!API_BASE) return { role: null, error: true };

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${REFRESH_COOKIE}=${refreshCookie}`,
      },
      // No body needed — backend reads the cookie
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
    // Network error or backend down — fail open to avoid locking out users
    // during outages; the backend API calls on the page will still 401 them.
    return { role: null, error: true };
  }
}

// ── Main middleware ────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Guard: /admin/* (except the login page itself) ─────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const refreshCookie = request.cookies.get(REFRESH_COOKIE)?.value;

    // No cookie at all → redirect straight to login
    if (!refreshCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      // Preserve intended destination so the login page can redirect back
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { role, error } = await tryRefresh(refreshCookie);

    if (error) {
      // Backend unreachable / cold-start — fail open; the page's authenticated
      // API calls will 401 if the session is truly invalid. Redirecting here
      // caused loop-bouncing when the edge couldn't reach the backend.
      return NextResponse.next();
    }

    if (role !== 'admin') {
      // Authenticated, but wrong role (e.g. a student guessing the URL)
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('hint', 'not_admin');
      return NextResponse.redirect(loginUrl);
    }

    // ✅ Authenticated admin — let the request through
    return NextResponse.next();
  }

  // ── Guard: /student/* ───────────────────────────────────────────────────
  if (pathname.startsWith('/student')) {
    const refreshCookie = request.cookies.get(REFRESH_COOKIE)?.value;

    if (!refreshCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { role, error } = await tryRefresh(refreshCookie);

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
