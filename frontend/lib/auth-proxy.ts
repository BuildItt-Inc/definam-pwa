/**
 * auth-proxy.ts — shared helpers for the Next.js auth proxy routes.
 *
 * WHY PROXY ROUTES?
 * The refresh_token cookie is set by the backend (e.g. api.definam.ng).
 * Browsers scope cookies to the domain that set them, so the frontend
 * (definam.ng) never receives that cookie in its requests. This means
 * Next.js Edge Middleware can never read it — causing an infinite
 * redirect loop after login.
 *
 * Solution: every auth endpoint that touches the refresh cookie is
 * proxied through a Next.js API route on the frontend domain. The proxy
 * forwards the backend's Set-Cookie header, re-issuing the cookie under
 * the frontend domain. The middleware then reads it normally.
 */

import { NextResponse } from 'next/server';

export const BACKEND =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

export const REFRESH_COOKIE = 'refresh_token';

/**
 * Copy the refresh_token Set-Cookie from the backend response onto the
 * proxy response, re-issuing it under the frontend (Next.js) domain.
 */
export function transplantRefreshCookie(
  backendSetCookie: string | null,
  response: NextResponse,
): void {
  if (!backendSetCookie) return;
  const valueMatch = backendSetCookie.match(/refresh_token=([^;]+)/);
  if (!valueMatch) return;
  const maxAgeMatch = backendSetCookie.match(/[Mm]ax-[Aa]ge=(\d+)/);
  response.cookies.set(REFRESH_COOKIE, valueMatch[1], {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // same-origin now — lax is correct and safe
    maxAge: maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 30 * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Clear the refresh_token cookie from the frontend domain.
 */
export function clearRefreshCookie(response: NextResponse): void {
  response.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
