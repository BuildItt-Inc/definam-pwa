import { NextRequest, NextResponse } from 'next/server';
import { BACKEND, REFRESH_COOKIE, transplantRefreshCookie } from '@/lib/auth-proxy';

// Called by middleware and the client-side refreshToken() helper.
// Reads the frontend-domain refresh_token cookie, forwards it to the backend,
// and re-plants the rotated cookie on the frontend domain.
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ detail: 'No session' }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${REFRESH_COOKIE}=${refreshToken}`,
      },
    });
  } catch {
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  const data = await backendRes.json();
  const response = NextResponse.json(data, { status: backendRes.status });

  if (backendRes.ok) {
    // Rotate the cookie on the frontend domain
    transplantRefreshCookie(backendRes.headers.get('set-cookie'), response);
  }

  return response;
}
