import { NextRequest, NextResponse } from 'next/server';
import { BACKEND } from '@/lib/auth-proxy';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

async function handleProxy(request: NextRequest, { path }: { path: string[] }) {
  const targetPath = path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND}/api/v1/${targetPath}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (['authorization', 'content-type', 'accept', 'cookie'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await request.arrayBuffer() : undefined;

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const resBody = await res.arrayBuffer();
    const responseHeaders = new Headers();
    const contentType = res.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);

    return new NextResponse(resBody, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend proxy failed';
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
