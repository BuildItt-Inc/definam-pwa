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

/**
 * Extracts a human-readable error message from a FastAPI response body.
 *
 * FastAPI returns two shapes:
 *   - String detail:  { "detail": "Invalid access code." }
 *   - Array detail:   { "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }  (Pydantic 422)
 *
 * Without this, calling extractDetail(body) on an array produces "[object Object]"
 * which is confusing and useless to the user.
 */
function extractDetail(body: unknown, fallback = ''): string {
  if (!body || typeof body !== 'object') return fallback;
  const b = body as Record<string, unknown>;
  const detail = b['detail'];
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // Pydantic validation error array — join the human-readable msg fields
    const msgs = detail
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const i = item as Record<string, unknown>;
          return typeof i['msg'] === 'string' ? (i['msg'] as string) : null;
        }
        return null;
      })
      .filter(Boolean);
    return msgs.length > 0 ? msgs.join('. ') : fallback;
  }
  return fallback;
}

/**
 * Handles 401 session expiration, specifically distinguishing single-session logouts
 * ("Session expired or logged in elsewhere.") from normal unauthenticated errors.
 */
export function handleAuthError(
  err: unknown,
  router?: { replace: (url: string) => void },
): boolean {
  const is401 =
    (err instanceof ApiError && err.status === 401) ||
    (typeof err === 'object' && err !== null && (err as { status?: number }).status === 401) ||
    (err instanceof Error && err.message === 'Not authenticated');

  if (is401) {
    const msg = err instanceof Error ? err.message : '';
    const isElsewhere =
      msg.toLowerCase().includes('elsewhere') ||
      msg.toLowerCase().includes('other device') ||
      msg.toLowerCase().includes('session expired');

    const targetUrl = isElsewhere
      ? '/login?reason=logged_in_elsewhere'
      : '/login?reason=session_expired';

    if (router) {
      router.replace(targetUrl);
    } else if (typeof window !== 'undefined') {
      window.location.replace(targetUrl);
    }
    return true;
  }
  return false;
}

// In-memory only. Never written to localStorage or sessionStorage.
let accessToken: string | null = null;
// Single-flight lock prevents concurrent API calls from stamping on rotating refresh tokens
let refreshInFlight: Promise<void> | null = null;
// In-memory / localStorage cache for /auth/me (SWR)
let cachedMe: UserMe | null = null;
const ME_CACHE_KEY = 'recall:cache:me';

export function getAccessToken(): string | null {
  return accessToken;
}

export function getCachedMe(): UserMe | null {
  if (cachedMe) return cachedMe;
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ME_CACHE_KEY);
    if (raw) {
      cachedMe = JSON.parse(raw) as UserMe;
      return cachedMe;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function setCachedMe(me: UserMe | null): void {
  cachedMe = me;
  if (typeof window === 'undefined') return;
  try {
    if (me) {
      localStorage.setItem(ME_CACHE_KEY, JSON.stringify(me));
    } else {
      localStorage.removeItem(ME_CACHE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function updateCachedMe(partial: Partial<UserMe>): void {
  const existing = getCachedMe();
  if (existing) {
    setCachedMe({ ...existing, ...partial });
  }
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
    throw new ApiError(res.status, extractDetail(body));
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
    throw new ApiError(res.status, extractDetail(body));
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
    throw new ApiError(res.status, extractDetail(body));
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
    throw new ApiError(res.status, extractDetail(body));
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
    throw new ApiError(res.status, extractDetail(body));
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
    throw new ApiError(res.status, extractDetail(body));
  }
}

// ── Token lifecycle ────────────────────────────────────────────────────────

// Uses the httpOnly refresh cookie the backend sets on login.
// Single-flight deduplication ensures concurrent API calls share one refresh request
// instead of racing on rotating refresh tokens.
export async function refreshToken(): Promise<void> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: '' }));
      throw new ApiError(res.status, extractDetail(body));
    }

    const json = (await res.json()) as { access_token: string };
    accessToken = json.access_token;
  })();

  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function logout(): Promise<void> {
  try {
    const { getStoredFcmToken, clearStoredFcmToken } = await import('@/lib/firebase');
    const { unregisterNotificationToken } = await import('@/lib/api/notifications');
    const token = getStoredFcmToken();
    if (token) {
      await unregisterNotificationToken(token).catch(() => {});
      clearStoredFcmToken();
    }
  } catch {
    // Best-effort cleanup — proceed with logout regardless
  }

  try {
    const { clearCurriculumCache } = await import('@/lib/api/topics');
    clearCurriculumCache();
  } catch {
    // ignore
  }

  setCachedMe(null);
  await fetch('/api/auth/logout', { method: 'POST' });
  accessToken = null;
  broadcastAuthChange('logout');
}

export async function getMe(): Promise<UserMe> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, extractDetail(body));
  }

  const me = (await res.json()) as UserMe;
  setCachedMe(me);
  return me;
}

export async function sendHeartbeat(): Promise<{ status: string; last_seen_at: string } | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/heartbeat`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) return null;
    return (await res.json()) as { status: string; last_seen_at: string };
  } catch {
    return null;
  }
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  if (!accessToken) {
    try {
      await refreshToken();
    } catch (err) {
      // Only pause & retry on transient network/cookie delay — not explicit 401 rejection
      const isHard401 = err instanceof ApiError && err.status === 401;
      if (isHard401) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 400));
      if (!accessToken) {
        try {
          await refreshToken();
        } catch {
          throw new ApiError(401, 'Not authenticated');
        }
      }
    }
  }

  if (!accessToken) throw new ApiError(401, 'Not authenticated');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

