import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body.token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    const { token } = body;
    const response = NextResponse.json({ ok: true });
    response.cookies.set('definam_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
