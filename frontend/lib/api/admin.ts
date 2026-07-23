import type { AdminDashboardData, StudentDetail, AccessCodesData } from '@/types/admin';
import { USE_MOCK, MOCK_DELAY_MS } from '@/lib/api/mock/week2';
import { ApiError, getAuthHeaders } from '@/lib/api/auth';

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  if (USE_MOCK) {
    const { mockAdminData } = await import('@/lib/api/mock/admin');
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return mockAdminData;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard`,
    { headers: await getAuthHeaders() },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new Error(body.error ?? 'Failed to fetch admin dashboard');
  }

  return res.json() as Promise<AdminDashboardData>;
}

export async function getStudentDetail(studentId: string): Promise<StudentDetail> {
  if (USE_MOCK) {
    const { mockStudentDetail } = await import('@/lib/api/mock/admin');
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    const student = mockStudentDetail[studentId];
    if (!student) throw new ApiError(404, 'Student not found');
    return student;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/students/${studentId}`,
    { headers: await getAuthHeaders() },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? 'Failed to fetch student detail');
  }

  return res.json() as Promise<StudentDetail>;
}

// ── SCR-12 · Access Code Management ───────────────────────────────────────

export async function getAccessCodes(): Promise<AccessCodesData> {
  if (USE_MOCK) {
    const { mockAccessCodes } = await import('@/lib/api/mock/admin');
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return mockAccessCodes;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/codes`,
    { headers: await getAuthHeaders() },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? 'Failed to fetch access codes');
  }

  return res.json() as Promise<AccessCodesData>;
}

export async function downloadCodes(filter: 'all' | 'unused'): Promise<void> {
  if (USE_MOCK) {
    const { mockAccessCodes } = await import('@/lib/api/mock/admin');
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

    const codes =
      filter === 'unused'
        ? mockAccessCodes.codes.filter((c) => c.status === 'unused')
        : mockAccessCodes.codes;

    const header = 'Code,Student Name,Status,Activated At\n';
    const rows = codes
      .map((c) => {
        const escapedName = c.student_name
          ? '"' + c.student_name.split('"').join('""') + '"'
          : '';
        return c.code + ',' + escapedName + ',' + c.status + ',' + (c.activated_at ?? '');
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recall-codes-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/codes/download?filter=${filter}`,
    { headers: await getAuthHeaders() }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new ApiError(res.status, body.error ?? 'Failed to download codes');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recall-codes-${filter}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
