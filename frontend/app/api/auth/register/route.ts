import { NextRequest, NextResponse } from 'next/server';
import { BACKEND, transplantRefreshCookie } from '@/lib/auth-proxy';

export async function POST(request: NextRequest) {
  const body = await request.text();

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
