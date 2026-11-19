'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Users,
  KeyRound,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import RecallLogo from '@/components/ui/RecallLogo';
import { logoutSuperAdmin } from '@/lib/api/superAdmin';
import { toast } from '@/lib/toast';

const NAV_ITEMS = [
  { href: '/admin/platform', label: 'Live Overview', icon: Activity, exact: true },
  { href: '/admin/platform/admins', label: 'Platform Admins', icon: ShieldCheck },
  { href: '/admin/platform/users', label: 'Users & Sessions', icon: Users },
  { href: '/admin/platform/codes', label: 'Access Codes', icon: KeyRound },
  { href: '/admin/platform/funnel', label: 'Funnel Analytics', icon: TrendingUp },
  { href: '/admin/platform/audit', label: 'Audit Logs', icon: ShieldAlert },
];

interface PlatformSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function PlatformSidebar({ isOpen, onClose }: PlatformSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logoutSuperAdmin();
      toast.info('Logged out', 'You have been signed out of Platform Control.');
      router.replace('/admin/platform/login');
    } catch {
      router.replace('/admin/platform/login');
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col justify-between h-full select-none transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header / Brand */}
          <div className="p-6 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <RecallLogo size={24} />
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-ink text-bg-0">
                  Super Admin
                </span>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg-2 md:hidden transition-colors"
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Platform Control
              </div>
              <div className="text-xs text-faint truncate mt-0.5">
                Definam Core Infrastructure
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              Management
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-ink text-bg-0 shadow-xs'
                      : 'text-muted hover:text-ink hover:bg-bg-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={16}
                      className={isActive ? 'text-bg-0' : 'text-muted'}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={13} className="text-bg-0/60" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/admin"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-ink hover:bg-bg-2 transition-colors"
          >
            <span className="text-[11px]">School Admin Area</span>
            <ExternalLink size={12} />
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger-bg transition-colors"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
