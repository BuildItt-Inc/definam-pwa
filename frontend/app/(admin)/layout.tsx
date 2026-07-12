import AdminSidebar from '@/components/admin/AdminSidebar';
import { mockAdminData } from '@/lib/api/mock/admin';

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { school_name, class_name, teacher_name, location } = mockAdminData;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-0">
      <AdminSidebar
        schoolName={school_name}
        className={class_name}
        teacherName={teacher_name}
        location={location}
      />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
