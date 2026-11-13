'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getAdminDashboard } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/auth';

interface SidebarInfo {
  school_name: string;
  class_name: string;
  teacher_name: string;
  location: string;
}

const FALLBACK: SidebarInfo = {
  school_name: 'Admin Portal',
  class_name: '—',
  teacher_name: 'Admin',
  location: '—',
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [info, setInfo] = useState<SidebarInfo>(FALLBACK);

  useEffect(() => {
    getAdminDashboard()
      .then((data) => {
        setInfo({
          school_name: data.school_name,
          class_name: data.class_name,
          teacher_name: data.teacher_name,
          location: data.location,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace('/admin/login');
        }
      });
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-0">
      <AdminSidebar
        schoolName={info.school_name}
        className={info.class_name}
        teacherName={info.teacher_name}
        location={info.location}
      />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
