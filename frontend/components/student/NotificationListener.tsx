'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { onForegroundMessage } from '@/lib/firebase';
import { useCelebration } from '@/components/ui/celebration/CelebrationContext';

export function NotificationListener() {
  const router = useRouter();
  const celebration = useCelebration();

  useEffect(() => {
    const unsubscribe = onForegroundMessage(({ title, body, data }) => {
      const notificationType = data?.type || 'recall';

      if (notificationType === 'streak') {
        const streakDays = parseInt(data?.streak || '1', 10);
        if (celebration?.celebrate) {
          celebration.celebrate({ type: 'streak', days: streakDays });
        } else {
          toast(title || '🔥 Keep your streak alive!', {
            description: body || "Don't lose your streak! Complete today's review.",
            action: {
              label: 'Review Now',
              onClick: () => router.push('/student/review'),
            },
          });
        }
      } else {
        toast(title || '📚 Daily Review Reminder', {
          description: body || 'You have topics to review today.',
          action: {
            label: 'Review Now',
            onClick: () => router.push('/student/review'),
          },
        });
      }
    });

    return () => unsubscribe();
  }, [router, celebration]);

  return null;
}
