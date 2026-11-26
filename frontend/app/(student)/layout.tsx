import { FloatingChatProvider } from '@/components/student/FloatingChat/FloatingChatContext';
import { FloatingChatWidget } from '@/components/student/FloatingChat/FloatingChatWidget';
import { NotificationListener } from '@/components/student/NotificationListener';
import { HeartbeatListener } from '@/components/HeartbeatListener';
import { KatexScripts } from '@/components/KatexScripts';
import { BottomNav } from '@/components/student/BottomNav';
import { DesktopSidebar } from '@/components/student/DesktopSidebar';

export default function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FloatingChatProvider>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossOrigin="anonymous" />
      <KatexScripts />
      <NotificationListener />
      <HeartbeatListener />
      {/* Desktop: flex row with sidebar. Mobile: single column */}
      <div className="md:flex min-h-screen bg-bg-0">
        <DesktopSidebar />
        <div className="flex-1 min-w-0 relative">
          <section className="min-h-screen bg-bg-0">{children}</section>
          <FloatingChatWidget />
          <BottomNav />
        </div>
      </div>
    </FloatingChatProvider>
  );
}
