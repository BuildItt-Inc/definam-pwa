import { getAuthHeaders, ApiError } from './auth';

export interface SuperAdminOverviewResponse {
  online_users: int;
  total_users: int;
  signups_today: int;
  users_by_role: Record<string, number>;
  access_codes_summary: Record<string, number>;
  processed_payments_count: number;
}

type int = number;

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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function getSuperAdminOverview(): Promise<SuperAdminOverviewResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/overview`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch overview' }));
    throw new ApiError(res.status, body.detail || 'Failed to fetch overview');
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
  const headers = await getAuthHeaders();
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
    throw new ApiError(res.status, body.detail || 'Failed to fetch users');
  }
  return res.json();
}

export async function getSuperAdminSignupAnalytics(days = 30): Promise<SuperAdminSignupAnalyticsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/analytics/signups?days=${days}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch signup analytics' }));
    throw new ApiError(res.status, body.detail || 'Failed to fetch signup analytics');
  }
  return res.json();
}

export async function getSuperAdminFunnel(): Promise<SuperAdminFunnelResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/analytics/funnel`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch funnel analytics' }));
    throw new ApiError(res.status, body.detail || 'Failed to fetch funnel analytics');
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
  const headers = await getAuthHeaders();
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));

  const res = await fetch(`${BASE_URL}/api/v1/super-admin/codes?${query.toString()}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to fetch access codes' }));
    throw new ApiError(res.status, body.detail || 'Failed to fetch access codes');
  }
  return res.json();
}

export async function generateAccessCodes(data: GenerateCodesRequest): Promise<GenerateCodesResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/codes/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to generate codes' }));
    throw new ApiError(res.status, body.detail || 'Failed to generate codes');
  }
  return res.json();
}

export async function revokeAccessCode(codeId: string): Promise<{ message: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/codes/${codeId}/revoke`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to revoke code' }));
    throw new ApiError(res.status, body.detail || 'Failed to revoke code');
  }
  return res.json();
}

export async function reactivateAccessCode(codeId: string): Promise<{ message: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/codes/${codeId}/reactivate`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to reactivate code' }));
    throw new ApiError(res.status, body.detail || 'Failed to reactivate code');
  }
  return res.json();
}

export async function resetSuperAdminUser(userId: string, data: ResetUserRequest): Promise<ResetUserResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/users/${userId}/reset`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to reset user' }));
    throw new ApiError(res.status, body.detail || 'Failed to reset user');
  }
  return res.json();
}

export async function deleteSuperAdminUser(userId: string): Promise<{ message: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/users/${userId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to delete user' }));
    throw new ApiError(res.status, body.detail || 'Failed to delete user');
  }
  return res.json();
}

export async function updateSuperAdminUserRole(userId: string, role: string): Promise<{ message: string; role: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/v1/super-admin/users/${userId}/role`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Failed to update user role' }));
    throw new ApiError(res.status, body.detail || 'Failed to update user role');
  }
  return res.json();
}
