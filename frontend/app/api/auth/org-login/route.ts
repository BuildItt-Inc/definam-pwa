import { NextRequest, NextResponse } from 'next/server';
import { BACKEND, transplantRefreshCookie } from '@/lib/auth-proxy';

export async function POST(request: NextRequest) {
  const body = await request.text();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const xff = request.headers.get('x-forwarded-for');
  if (xff) headers['x-forwarded-for'] = xff;

  const realIp = request.headers.get('x-real-ip');
  if (realIp) headers['x-real-ip'] = realIp;

  const ua = request.headers.get('user-agent');
  if (ua) headers['user-agent'] = ua;

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/api/v1/auth/org-login`, {
      method: 'POST',
      headers,
      body,
    });
  } catch {
    return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
  }

  const data = await backendRes.json();
  const response = NextResponse.json(data, { status: backendRes.status });

  if (backendRes.ok) {
    transplantRefreshCookie(backendRes.headers.get('set-cookie'), response);
  }

  return response;
}
