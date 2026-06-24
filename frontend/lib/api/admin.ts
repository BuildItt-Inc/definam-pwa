import type { AdminDashboardData } from '@/types/admin';
import { USE_MOCK, MOCK_DELAY_MS } from '@/lib/api/mock/week2';

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  if (USE_MOCK) {
    const { mockAdminData } = await import('@/lib/api/mock/admin');
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return mockAdminData;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard`,
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new Error(body.error ?? 'Failed to fetch admin dashboard');
  }

  return res.json() as Promise<AdminDashboardData>;
}
