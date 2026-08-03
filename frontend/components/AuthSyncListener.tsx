'use client';

import { useEffect } from 'react';
import { onAuthChange } from '@/lib/api/auth';

export default function AuthSyncListener() {
  useEffect(() => {
    const unsubscribe = onAuthChange(() => {
      window.location.reload();
    });
    return unsubscribe;
  }, []);

  return null;
}
