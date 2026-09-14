import { FloatingChatProvider } from '@/components/student/FloatingChat/FloatingChatContext';
import { FloatingChatWidget } from '@/components/student/FloatingChat/FloatingChatWidget';
import { NotificationListener } from '@/components/student/NotificationListener';

export default function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FloatingChatProvider>
      <NotificationListener />
      <section>{children}</section>
      <FloatingChatWidget />
    </FloatingChatProvider>
  );
}
