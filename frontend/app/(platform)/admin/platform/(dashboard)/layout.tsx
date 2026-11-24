'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import RecallLogo from '@/components/ui/RecallLogo';
import PlatformSidebar from '@/components/platform/PlatformSidebar';
import { refreshSuperAdmin, ApiError } from '@/lib/api/superAdmin';

export default function PlatformDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fallbackTimer = setTimeout(() => {
      if (mounted && authorized === null) {
        window.location.href = '/admin/platform/login?expired=1';
      }
    }, 6000);

    // Verify session on mount
    refreshSuperAdmin()
      .then(() => {
        clearTimeout(fallbackTimer);
        if (mounted) setAuthorized(true);
      })
      .catch((err: unknown) => {
        clearTimeout(fallbackTimer);
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          window.location.href = '/admin/platform/login?expired=1';
        } else {
          // If network glitch or already has token, allow rendering while edge middleware handles it
          if (mounted) setAuthorized(true);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

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
    <div className="flex h-screen overflow-hidden bg-bg-0 flex-col md:flex-row">
      {/* Mobile Top App Bar */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-border bg-bg-0 text-ink hover:bg-bg-2 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <RecallLogo size={20} />
            <span className="text-xs font-extrabold tracking-tight text-ink">Recall Platform</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase tracking-wider bg-ink text-bg-0">
          Super Admin
        </span>
      </header>

      {/* Responsive Platform Sidebar */}
      <PlatformSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-bg-0 w-full">
        {children}
      </main>
    </div>
  );
}
