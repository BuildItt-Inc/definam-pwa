import type {
  LoginRequest,
  LoginResponse,
  AdminLoginRequest,
  AdminLoginResponse,
  ChangePasswordRequest,
  RegisterRequest,
  RegisterResponse,
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

// Unauthenticated — no cookie required, hits backend directly.
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }

  return res.json() as Promise<LoginResponse>;
}

// ── SCR-03d · Admin Login ──────────────────────────────────────────────────

// Unauthenticated — no cookie required, hits backend directly.
export async function adminLogin(
  data: AdminLoginRequest,
): Promise<AdminLoginResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login`,
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

  return res.json() as Promise<AdminLoginResponse>;
}

// Authenticated — proxied through Next.js so the request is same-origin and
// the browser attaches the definam_token httpOnly cookie automatically.
export async function changePassword(
  data: ChangePasswordRequest,
): Promise<{ ok: true }> {
  const res = await fetch('/api/proxy/auth/admin/change-password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }

  return res.json() as Promise<{ ok: true }>;
}

// ── SCR-02a-ii · Individual Registration ──────────────────────────────────

// Unauthenticated — no cookie required, hits backend directly.
export async function registerUser(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? '');
  }

  return res.json() as Promise<RegisterResponse>;
}
