import { NextRequest, NextResponse } from 'next/server';
import {
  BACKEND,
  SUPER_ADMIN_REFRESH_COOKIE,
  clearSuperAdminRefreshCookie,
} from '@/lib/auth-proxy';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(SUPER_ADMIN_REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${BACKEND}/api/v1/auth/super-admin/logout`, {
        method: 'POST',
        headers: {
          Cookie: `${SUPER_ADMIN_REFRESH_COOKIE}=${refreshToken}`,
        },
      });
    } catch {
      // Backend error ignored on logout; clear cookie anyway
    }
  }

  const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  clearSuperAdminRefreshCookie(response);
  return response;
}
