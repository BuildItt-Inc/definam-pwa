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
import { motion } from 'framer-motion';
import { scaleTap } from '@/lib/motion';

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
    <div className="flex flex-col h-full bg-bg-0">
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-[14px] border-b border-border-2">
        <span className="font-bold text-[15px] font-extrabold text-ink tracking-tight">
          DefinAm
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-0.5 text-muted hover:text-ink transition-colors"
            aria-label="Close menu"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* School info */}
      <div className="px-4 py-4 border-b border-border-2">
        <div className="bg-bg-1 p-3 rounded-[24px]">
          <p className="text-sm font-black text-ink leading-tight mb-1">{schoolName}</p>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider leading-tight">
            {location} · {className} · {teacherName}
          </p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.activePath
                  : pathname.startsWith(item.activePath);
                return (
                  <motion.div key={item.label} {...scaleTap}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-[10px] px-3 py-2 text-[12px] font-semibold rounded-[24px] transition-colors ${ isActive ? 'bg-bg-1 text-ink shadow-sm border border-border-2' : 'text-muted hover:bg-bg-1 hover:text-ink' }`}
                    >
                      <item.icon size={14} strokeWidth={2} />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout — always last */}
        <div className="pt-4 border-t border-border-2 mt-4">
          <motion.button
            {...scaleTap}
            onClick={onLogout}
            className="w-full flex items-center gap-[10px] px-3 py-2 rounded-[24px] text-[12px] font-semibold text-muted hover:bg-bg-1 hover:text-error transition-colors"
          >
            <LogOut size={14} strokeWidth={2} />
            Logout
          </motion.button>
        </div>
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
      <aside className="hidden md:flex flex-col w-64 h-full border-r border-border-2 shrink-0 bg-bg-0">
        <SidebarBody
          {...props}
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile: hamburger trigger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-bg-0 border border-border-2 rounded-[16px] shadow-sm"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} className="text-ink" strokeWidth={1.5} />
      </button>

      {/* Mobile: backdrop */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-ink/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: slide-in panel */}
      {mobileOpen && (
        <motion.aside 
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="md:hidden fixed left-0 top-0 h-full w-64 z-50 border-r border-border-2 bg-bg-0 shadow-2xl"
        >
          <SidebarBody
            {...props}
            pathname={pathname}
            onLogout={handleLogout}
            onClose={() => setMobileOpen(false)}
          />
        </motion.aside>
      )}
    </>
  );
}
