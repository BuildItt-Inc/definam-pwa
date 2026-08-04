import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  RegisterRequest,
  RegisterResponse,
  OrgLoginRequest,
  OrgLoginResponse,
  UserMe,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types/auth';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// In-memory only. Never written to localStorage or sessionStorage.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

const authChannel: BroadcastChannel | null =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('auth')
    : null;

function broadcastAuthChange(type: 'login' | 'logout') {
  authChannel?.postMessage({ type });
}

export function onAuthChange(callback: (type: 'login' | 'logout') => void): () => void {
  if (!authChannel) return () => {};
  const handler = (event: MessageEvent<{ type: 'login' | 'logout' }>) => {
    callback(event.data.type);
  };
  authChannel.addEventListener('message', handler);
  return () => authChannel.removeEventListener('message', handler);
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  // Route through the Next.js proxy so the refresh_token cookie is set on
  // the frontend domain and the Edge Middleware can read it.
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? '');
  }

  const json: LoginResponse = await res.json();
  accessToken = json.access_token;
  broadcastAuthChange('login');
  return json;
}

// Authenticated — sends access token in Authorization header.
export async function changePassword(
  data: ChangePasswordRequest,
): Promise<{ ok: true }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/change-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? '');
  }

  return res.json() as Promise<{ ok: true }>;
}

// ── SCR-02a-ii · Individual Registration ──────────────────────────────────

export async function registerUser(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? '');
  }

  const json: RegisterResponse = await res.json();
  accessToken = json.access_token;
  broadcastAuthChange('login');
  return json;
}

// ── F1 · Org Student Login ────────────────────────────────────────────────

export async function orgLogin(
  data: OrgLoginRequest,
): Promise<OrgLoginResponse> {
  const res = await fetch('/api/auth/org-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? '');
  }

  const json: OrgLoginResponse = await res.json();
  accessToken = json.access_token;
  broadcastAuthChange('login');
  return json;
}

// ── Password Reset ────────────────────────────────────────────────────────

export async function forgotPassword(data: ForgotPasswordRequest): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? '');
  }
}

export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? '');
  }
}

// ── Token lifecycle ────────────────────────────────────────────────────────

// Uses the httpOnly refresh cookie the backend sets on login.
export async function refreshToken(): Promise<void> {
  // Calls the Next.js proxy which reads the frontend-domain cookie and
  // forwards it to the backend, returning a new access_token.
  const res = await fetch('/api/auth/refresh', { method: 'POST' });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? '');
  }

  const json = (await res.json()) as { access_token: string };
  accessToken = json.access_token;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
  accessToken = null;
  broadcastAuthChange('logout');
}

export async function getMe(): Promise<UserMe> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? '');
  }

  return res.json() as Promise<UserMe>;
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  if (!accessToken) {
    // First attempt
    try {
      await refreshToken();
    } catch {
      // Mobile Safari can delay cross-origin cookie transmission on first load.
      // Wait briefly and retry once before declaring the session gone.
      await new Promise((r) => setTimeout(r, 800));
      try {
        await refreshToken();
      } catch {
        throw new ApiError(401, 'Not authenticated');
      }
    }
  }

  if (!accessToken) throw new ApiError(401, 'Not authenticated');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}
