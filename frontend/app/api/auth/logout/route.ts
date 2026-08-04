import { NextRequest, NextResponse } from 'next/server';
import { BACKEND, REFRESH_COOKIE, clearRefreshCookie } from '@/lib/auth-proxy';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Inform backend (best-effort — don't block the client on failure)
  if (refreshToken && BACKEND) {
    await fetch(`${BACKEND}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
    }).catch(() => { /* ignore */ });
  }

  const response = NextResponse.json({ ok: true });
  clearRefreshCookie(response);
  return response;
}
