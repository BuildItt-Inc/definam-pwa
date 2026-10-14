import { FloatingChatProvider } from '@/components/student/FloatingChat/FloatingChatContext';
import { FloatingChatWidget } from '@/components/student/FloatingChat/FloatingChatWidget';
import { NotificationListener } from '@/components/student/NotificationListener';
import { KatexScripts } from '@/components/KatexScripts';

export default function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FloatingChatProvider>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossOrigin="anonymous" />
      <KatexScripts />
      <NotificationListener />
      <section>{children}</section>
      <FloatingChatWidget />
    </FloatingChatProvider>
  );
}
