import { NextRequest, NextResponse } from 'next/server';
import {
  BACKEND,
  SUPER_ADMIN_REFRESH_COOKIE,
  transplantSuperAdminRefreshCookie,
} from '@/lib/auth-proxy';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(SUPER_ADMIN_REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ detail: 'No super admin session' }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/api/v1/auth/super-admin/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${SUPER_ADMIN_REFRESH_COOKIE}=${refreshToken}`,
      },
    });
  } catch {
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  const data = await backendRes.json();
  const response = NextResponse.json(data, { status: backendRes.status });

  if (backendRes.ok) {
    transplantSuperAdminRefreshCookie(backendRes.headers.get('set-cookie'), response);
  }

  return response;
}
