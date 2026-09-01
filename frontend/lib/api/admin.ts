import type { AdminDashboardData, StudentDetail, AccessCodesData, SchoolClass, AdminSubjectItem, SubjectDetail } from '@/types/admin';
import { USE_MOCK, MOCK_DELAY_MS } from '@/lib/api/mock/week2';
import { ApiError, getAuthHeaders } from '@/lib/api/auth';

export async function getAdminDashboard(classId?: string): Promise<AdminDashboardData> {
  if (USE_MOCK) {
    const { mockAdminData } = await import('@/lib/api/mock/admin');
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return mockAdminData;
  }

  const url = classId
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard?class_id=${classId}`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard`;

  const res = await fetch(url, { headers: await getAuthHeaders() });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to fetch admin dashboard');
  }

  return res.json() as Promise<AdminDashboardData>;
}

export async function getClasses(): Promise<SchoolClass[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/classes`,
    { headers: await getAuthHeaders() }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to fetch classes');
  }
  return res.json() as Promise<SchoolClass[]>;
}

export async function createClass(name: string): Promise<{ id: string; name: string }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/classes`,
    {
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to create class');
  }
  return res.json() as Promise<{ id: string; name: string }>;
}

export async function assignStudentsToClass(classId: string, studentIds: string[]): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/classes/${classId}/assign`,
    {
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ student_ids: studentIds }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to assign students');
  }
}

export async function removeStudentsFromClass(classId: string, studentIds: string[]): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/classes/${classId}/remove`,
    {
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ student_ids: studentIds }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to remove students');
  }
}

export async function deleteClass(classId: string): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/classes/${classId}`,
    {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to delete class');
  }
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
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? 'Failed to fetch student detail');
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
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? 'Failed to fetch access codes');
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
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? 'Failed to download codes');
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

export async function revokeCode(codeId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/codes/revoke`,
    {
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code_id: codeId }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? 'Failed to revoke code');
  }
}

export async function reactivateCode(codeId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/codes/reactivate`,
    {
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code_id: codeId }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? 'Failed to reactivate code');
  }
}

export async function getAdminSubjects(): Promise<AdminSubjectItem[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/subjects`,
    { headers: await getAuthHeaders() }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to fetch subjects');
  }
  return res.json() as Promise<AdminSubjectItem[]>;
}

export async function getSubjectDetail(subjectName: string): Promise<SubjectDetail> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/subjects/${encodeURIComponent(subjectName)}`,
    { headers: await getAuthHeaders() }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to fetch subject detail');
  }
  return res.json() as Promise<SubjectDetail>;
}

export async function regenerateSubjectCurriculum(subjectName: string): Promise<{ message: string }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/curriculum/generate/${encodeURIComponent(subjectName)}`,
    {
      method: 'POST',
      headers: await getAuthHeaders(),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to regenerate subject curriculum');
  }
  return res.json();
}

export async function deleteSubject(subjectName: string): Promise<{ message: string; deleted_rows: number }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/subjects/${encodeURIComponent(subjectName)}`,
    {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to delete subject');
  }
  return res.json();
}

export async function mergeSubjects(sourceName: string, targetName: string): Promise<{ message: string; renamed: number; dropped: number }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/subjects/merge`,
    {
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source_name: sourceName, target_name: targetName }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new Error(body.detail ?? 'Failed to merge subjects');
  }
  return res.json();
}

