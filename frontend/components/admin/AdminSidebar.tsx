'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  KeyRound,
  Download,
  BarChart2,
  School,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { logout } from '@/lib/api/auth';

interface AdminSidebarProps {
  schoolName: string;
  className: string;
  teacherName: string;
  location: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  activePath: string;
  exact: boolean;
}

const NAV_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Students',
    items: [
      {
        label: 'Student Overview',
        icon: LayoutDashboard,
        href: '/admin',
        activePath: '/admin',
        exact: true,
      },
    ],
  },
  {
    label: 'Codes',
    items: [
      {
        label: 'Access Codes',
        icon: KeyRound,
        href: '/admin/ids',
        activePath: '/admin/ids',
        exact: false,
      },
    ],
  },
  {
    label: 'Reports',
    items: [
      {
        label: 'Export Report',
        icon: Download,
        href: '/admin/reports',
        activePath: '/admin/reports',
        exact: false,
      },
      {
        label: 'Analytics',
        icon: BarChart2,
        href: '/admin/analytics',
        activePath: '/admin/analytics',
        exact: false,
      },
      {
        label: 'My Classes',
        icon: School,
        href: '/admin/classes',
        activePath: '/admin/classes',
        exact: false,
      },
      {
        label: 'Settings',
        icon: Settings,
        href: '/admin/settings',
        activePath: '/admin/settings',
        exact: false,
      },
    ],
  },
];

function SidebarBody({
  schoolName,
  className,
  teacherName,
  location,
  pathname,
  onLogout,
  onClose,
}: AdminSidebarProps & {
  pathname: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-[#F0F0F0]">
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-[14px] border-b border-gray-200">
        <span className="font-syne text-[15px] font-extrabold text-ink tracking-tight">
          DefinAm
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-0.5 text-gray-400 hover:text-ink transition-colors"
            aria-label="Close menu"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* School info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-[11px] font-bold text-ink leading-tight">{schoolName}</p>
        <p className="text-[10px] text-gray-400 mt-1 leading-tight">
          {location} · {className} · {teacherName}
        </p>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-4 pt-[10px] pb-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-gray-400">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.activePath
                : pathname.startsWith(item.activePath);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-[7px] px-4 py-[7px] text-[11px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-jade text-white'
                      : 'text-gray-500 hover:bg-jade/10 hover:text-jade'
                  }`}
                >
                  <item.icon size={13} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Logout — always last */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-[7px] px-4 py-[7px] text-[11px] font-semibold text-gray-500 hover:bg-red-50 hover:text-coral transition-colors"
        >
          <LogOut size={13} strokeWidth={1.5} />
          Logout
        </button>
      </nav>
    </div>
  );
}

export default function AdminSidebar(props: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error('Failed to log out on server:', err);
    } finally {
      router.push('/login');
    }
  }

  return (
    <>
      {/* Desktop: always visible, in-flow */}
      <aside className="hidden md:flex flex-col w-56 h-full border-r border-gray-200 shrink-0">
        <SidebarBody
          {...props}
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile: hamburger trigger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} className="text-ink" strokeWidth={1.5} />
      </button>

      {/* Mobile: backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: slide-in panel */}
      {mobileOpen && (
        <aside className="md:hidden fixed left-0 top-0 h-full w-56 z-50 border-r border-gray-200">
          <SidebarBody
            {...props}
            pathname={pathname}
            onLogout={handleLogout}
            onClose={() => setMobileOpen(false)}
          />
        </aside>
      )}
    </>
  );
}
