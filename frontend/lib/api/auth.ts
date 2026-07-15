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

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }

  const json: LoginResponse = await res.json();
  accessToken = json.access_token;
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
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }

  return res.json() as Promise<{ ok: true }>;
}

// ── SCR-02a-ii · Individual Registration ──────────────────────────────────

export async function registerUser(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }

  const json: RegisterResponse = await res.json();
  accessToken = json.access_token;
  return json;
}

// ── F1 · Org Student Login ────────────────────────────────────────────────

export async function orgLogin(
  data: OrgLoginRequest,
): Promise<OrgLoginResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/org-login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }

  const json: OrgLoginResponse = await res.json();
  accessToken = json.access_token;
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
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
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
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }
}

// ── Token lifecycle ────────────────────────────────────────────────────────

// Uses the httpOnly refresh cookie the backend sets on login.
export async function refreshToken(): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }

  const json = (await res.json()) as { access_token: string };
  accessToken = json.access_token;
}

export async function logout(): Promise<void> {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  accessToken = null;
}

export async function getMe(): Promise<UserMe> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
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
