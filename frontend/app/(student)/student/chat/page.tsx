'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFloatingChat } from '@/components/student/FloatingChat/FloatingChatContext';

export default function ChatPage() {
  const router = useRouter();
  const { openChat } = useFloatingChat();

  useEffect(() => {
    openChat();
    router.replace('/student');
  }, [openChat, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-0">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
    </div>
  );
}
