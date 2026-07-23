import { FloatingChatProvider } from '@/components/student/FloatingChat/FloatingChatContext';
import { FloatingChatWidget } from '@/components/student/FloatingChat/FloatingChatWidget';

export default function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FloatingChatProvider>
      <section>{children}</section>
      <FloatingChatWidget />
    </FloatingChatProvider>
  );
}
