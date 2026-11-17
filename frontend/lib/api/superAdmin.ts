import { ApiError } from './auth';

export { ApiError };

export interface SuperAdminOverviewResponse {
  online_users: number;
  total_users: number;
  signups_today: number;
  users_by_role: Record<string, number>;
  access_codes_summary: Record<string, number>;
  processed_payments_count: number;
}

export interface SuperAdminUserItem {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  org_id: string | null;
  school_name: string | null;
  created_at: string;
  last_seen_at: string | null;
  is_online: boolean;
  force_password_change: boolean;
}

export interface SuperAdminUsersListResponse {
  items: SuperAdminUserItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SignupTrendItem {
  date: string;
  count: number;
  by_role: Record<string, number>;
}

export interface SuperAdminSignupAnalyticsResponse {
  days: number;
  total_signups: number;
  daily_trends: SignupTrendItem[];
}

export interface FunnelStepItem {
  step: number;
  name: string;
  description: string;
  count: number;
  conversion_from_first: number;
  conversion_from_previous: number;
}

export interface SuperAdminFunnelResponse {
  total_students: number;
  funnel: FunnelStepItem[];
}

export interface AccessCodeItem {
  id: string;
  code: string;
  type: string;
  status: string;
  school_id: string | null;
  school_name: string | null;
  activated_by: string | null;
  activated_by_username: string | null;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface AccessCodeListResponse {
  items: AccessCodeItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GenerateCodesRequest {
  type: 'individual' | 'org';
  school_id?: string;
  count: number;
  prefix: string;
  duration_months: number;
}

export interface GenerateCodesResponse {
  count: number;
  type: string;
  codes: string[];
}

export interface ResetUserRequest {
  reset_session?: boolean;
  clear_device_fingerprint?: boolean;
  new_password?: string;
  force_password_change?: boolean;
}

export interface ResetUserResponse {
  success: boolean;
  message: string;
  temporary_password?: string | null;
}

// ── Super Admin Item & Invites ──────────────────────────────────────────────

export interface SuperAdminItem {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  created_at: string;
  last_seen_at: string | null;
}

export interface SuperAdminListResponse {
  items: SuperAdminItem[];
  total: number;
}

export interface SuperAdminInviteItem {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invited_by_username: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  is_expired: boolean;
}

export interface SuperAdminInviteListResponse {
  items: SuperAdminInviteItem[];
  total: number;
}

export interface TractionMetrics {
  signups: number;
  active_users: number;
  topics_reviewed: number;
  chat_messages: number;
  revenue_naira: number;
}

export interface PlatformTractionResponse {
  period: 'weekly' | 'monthly' | 'yearly';
  current: TractionMetrics;
  previous: TractionMetrics;
  percent_changes: Record<string, number | null>;
  breakdown_labels: string[];
  breakdown_data: TractionMetrics[];
}

export interface ClearActivityResponse {
  success: boolean;
  message: string;
  deleted_counts: Record<string, number>;
}

// ── Audit Logs ─────────────────────────────────────────────────────────────

export interface AuditLogItem {
  id: string;
  actor_user_id: string;
  actor_username: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── In-memory Super Admin Token Management ─────────────────────────────────

let superAdminAccessToken: string | null = null;

function extractErrorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const msgs = detail
      .map((item) =>
        typeof item === 'string'
          ? item
          : item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg)
            : ''
      )
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join('; ');
  }
  if (detail && typeof detail === 'object') {
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function getSuperAdminAccessToken(): string | null {
  return superAdminAccessToken;
}

export function setSuperAdminAccessToken(token: string | null): void {
  superAdminAccessToken = token;
}

export async function refreshSuperAdmin(): Promise<{ access_token: string; role: string }> {
  const res = await fetch('/api/auth/super-admin/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to refresh token' }));
    superAdminAccessToken = null;
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Super admin session expired'));
  }

  const data = await res.json();
  superAdminAccessToken = data.access_token;
  return data;
}

export async function getSuperAdminAuthHeaders(): Promise<HeadersInit> {
  if (!superAdminAccessToken) {
    try {
      await refreshSuperAdmin();
    } catch {
      await new Promise((r) => setTimeout(r, 600));
      try {
        await refreshSuperAdmin();
      } catch {
        throw new ApiError(401, 'Not authenticated as super admin');
      }
    }
  }

  if (!superAdminAccessToken) {
    throw new ApiError(401, 'Not authenticated as super admin');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${superAdminAccessToken}`,
  };
}

// ── Super Admin Auth Methods ───────────────────────────────────────────────

export async function loginSuperAdmin(data: { email: string; password: string }): Promise<{
  access_token: string;
  token_type: string;
  role: string;
  force_password_change: boolean;
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
    role: string;
  };
}> {
  const emailVal = data.email.trim().toLowerCase();
  const res = await fetch('/api/auth/super-admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username_or_email: emailVal,
      email: emailVal,
      password: data.password,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Invalid super admin credentials'));
  }

  const json = await res.json();
  superAdminAccessToken = json.access_token;
  return json;
}

export async function logoutSuperAdmin(): Promise<void> {
  superAdminAccessToken = null;
  try {
    await fetch('/api/auth/super-admin/logout', { method: 'POST' });
  } catch {
    // Ignore network error on logout
  }
}

export async function acceptSuperAdminInvite(data: { token: string; password: string }): Promise<{
  access_token: string;
  token_type: string;
  role: string;
  force_password_change: boolean;
}> {
  const res = await fetch('/api/auth/super-admin/accept-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Invalid or expired invite token.'));
  }

  const json = await res.json();
  superAdminAccessToken = json.access_token;
  return json;
}

// ── Base URL & API Calls ───────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function getSuperAdminOverview(): Promise<SuperAdminOverviewResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/overview`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch overview' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch overview'));
  }
  return res.json();
}

export async function getSuperAdminUsers(params?: {
  role?: string;
  is_online?: boolean;
  search?: string;
  school_id?: string;
  page?: number;
  page_size?: number;
}): Promise<SuperAdminUsersListResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.is_online !== undefined) query.set('is_online', String(params.is_online));
  if (params?.search) query.set('search', params.search);
  if (params?.school_id) query.set('school_id', params.school_id);
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));

  const res = await fetch(`${BASE_URL}/api/v1/super-admin/users?${query.toString()}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch users' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch users'));
  }
  return res.json();
}

export async function getSuperAdminSignupAnalytics(days = 30): Promise<SuperAdminSignupAnalyticsResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/analytics/signups?days=${days}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch signup analytics' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch signup analytics'));
  }
  return res.json();
}

export async function getSuperAdminFunnel(): Promise<SuperAdminFunnelResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/analytics/funnel`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch funnel analytics' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch funnel analytics'));
  }
  return res.json();
}

export async function getSuperAdminCodes(params?: {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<AccessCodeListResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));

  const res = await fetch(`${BASE_URL}/api/v1/super-admin/codes?${query.toString()}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch access codes' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch access codes'));
  }
  return res.json();
}

export async function generateAccessCodes(data: GenerateCodesRequest): Promise<GenerateCodesResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/codes/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to generate codes' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to generate codes'));
  }
  return res.json();
}

export async function revokeAccessCode(codeId: string): Promise<{ message: string }> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/codes/${codeId}/revoke`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to revoke code' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to revoke code'));
  }
  return res.json();
}

export async function reactivateAccessCode(codeId: string): Promise<{ message: string }> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/codes/${codeId}/reactivate`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to reactivate code' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to reactivate code'));
  }
  return res.json();
}

export async function resetSuperAdminUser(userId: string, data: ResetUserRequest): Promise<ResetUserResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/users/${userId}/reset`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to reset user' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to reset user'));
  }
  return res.json();
}

export async function deleteSuperAdminUser(userId: string): Promise<{ message: string }> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/users/${userId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to delete user' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to delete user'));
  }
  return res.json();
}

export async function updateSuperAdminUserRole(userId: string, role: string): Promise<{ message: string; role: string }> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/users/${userId}/role`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to update user role' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to update user role'));
  }
  return res.json();
}

// ── Super Admin Invites & Management API ────────────────────────────────────

export async function listSuperAdmins(): Promise<SuperAdminListResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/admins`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch super admins' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch super admins'));
  }
  return res.json();
}

export async function sendSuperAdminInvite(data: { email: string }): Promise<{
  id: string;
  email: string;
  expires_at: string;
  message: string;
}> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/admins/invite`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to send invite' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to send invite'));
  }
  return res.json();
}

export async function listSuperAdminInvites(): Promise<SuperAdminInviteListResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/admins/invites`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch invites' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch invites'));
  }
  return res.json();
}

export async function revokeSuperAdminInvite(inviteId: string): Promise<{ message: string }> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/admins/invite/${inviteId}/revoke`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to revoke invite' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to revoke invite'));
  }
  return res.json();
}

export async function removeSuperAdmin(userId: string): Promise<{ message: string }> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/admins/${userId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to remove admin' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to remove admin'));
  }
  return res.json();
}

export async function clearRevokedSuperAdminInvites(): Promise<{ message: string; deleted_count: number }> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/admins/invites/revoked`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to clear revoked invites' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to clear revoked invites'));
  }
  return res.json();
}

export async function getPlatformTraction(
  period: 'weekly' | 'monthly' | 'yearly' = 'monthly'
): Promise<PlatformTractionResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/analytics/traction?period=${period}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch platform traction' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch platform traction'));
  }
  return res.json();
}

export async function clearPlatformActivity(params: {
  confirmation: string;
  clear_chat_messages?: boolean;
  clear_topic_reviews?: boolean;
  clear_daily_activity?: boolean;
  clear_recall_queues?: boolean;
}): Promise<ClearActivityResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/activity/clear`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to clear activity data' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to clear activity data'));
  }
  return res.json();
}

// ── Super Admin Audit Logs API ─────────────────────────────────────────────

export async function getSuperAdminAuditLogs(params?: {
  actor_user_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}): Promise<AuditLogListResponse> {
  const headers = await getSuperAdminAuthHeaders();
  const query = new URLSearchParams();
  if (params?.actor_user_id) query.set('actor_user_id', params.actor_user_id);
  if (params?.action) query.set('action', params.action);
  if (params?.date_from) query.set('date_from', params.date_from);
  if (params?.date_to) query.set('date_to', params.date_to);
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));

  const res = await fetch(`${BASE_URL}/api/v1/super-admin/audit-logs?${query.toString()}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch audit logs' }));
    throw new ApiError(res.status, extractErrorMessage(body.detail, 'Failed to fetch audit logs'));
  }
  return res.json();
}
