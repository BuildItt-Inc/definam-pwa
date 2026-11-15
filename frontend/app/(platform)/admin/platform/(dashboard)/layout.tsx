'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PlatformSidebar from '@/components/platform/PlatformSidebar';
import { refreshSuperAdmin, ApiError } from '@/lib/api/superAdmin';

export default function PlatformDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Verify session on mount
    refreshSuperAdmin()
      .then(() => setAuthorized(true))
      .catch((err: unknown) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace('/admin/platform/login');
        } else {
          // If network glitch or already has token, allow rendering while edge middleware handles it
          setAuthorized(true);
        }
      });
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-0">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Loading Platform Console...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-0">
      <PlatformSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-bg-0">
        {children}
      </main>
    </div>
  );
}
