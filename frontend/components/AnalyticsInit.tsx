'use client';

import { useEffect } from 'react';
import { getPostHog } from '@/lib/analytics';

/**
 * Initializes client-side PostHog tracking on initial page load if NEXT_PUBLIC_POSTHOG_KEY is present.
 */
export function AnalyticsInit() {
  useEffect(() => {
    void getPostHog();
  }, []);

  return null;
}
