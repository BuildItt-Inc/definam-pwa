import { NextRequest, NextResponse } from 'next/server';
import {
  BACKEND,
  SUPER_ADMIN_REFRESH_COOKIE,
  transplantSuperAdminRefreshCookie,
  clearSuperAdminRefreshCookie,
} from '@/lib/auth-proxy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(SUPER_ADMIN_REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    const res = NextResponse.json({ detail: 'No super admin session' }, { status: 401 });
    clearSuperAdminRefreshCookie(res);
    return res;
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/api/v1/auth/super-admin/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${SUPER_ADMIN_REFRESH_COOKIE}=${refreshToken}`,
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  const data = await backendRes.json().catch(() => ({ detail: 'Invalid backend response' }));
  const response = NextResponse.json(data, { status: backendRes.status });

  if (backendRes.ok) {
    transplantSuperAdminRefreshCookie(backendRes.headers.get('set-cookie'), response);
  } else if (backendRes.status === 401 || backendRes.status === 403) {
    clearSuperAdminRefreshCookie(response);
  }

  return response;
}
