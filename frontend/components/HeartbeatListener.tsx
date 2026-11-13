'use client';

import { useEffect, useRef } from 'react';
import { sendHeartbeat } from '@/lib/api/auth';

const HEARTBEAT_INTERVAL_MS = 60_000; // 60 seconds (matches backend Redis throttle)

/**
 * Presence Heartbeat:
 * Pings POST /api/v1/auth/heartbeat every 60s while the student has the app open.
 * Automatically pauses when the screen/tab is in the background to save battery and network.
 * Immediately resumes when the student switches back into the app.
 */
export function HeartbeatListener() {
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    async function ping() {
      if (document.hidden) return;
      const now = Date.now();
      // Throttle client-side so rapid tab toggling does not spam the network
      if (now - lastPingRef.current < 45_000) return;
      lastPingRef.current = now;

      try {
        await sendHeartbeat();
      } catch {
        // Silently ignore network failures — presence is best-effort
      }
    }

    // Ping on initial mount
    void ping();

    // Recurring interval
    timer = setInterval(() => {
      if (!isCancelled) {
        void ping();
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Visibility change handler (app resumed from background)
    function onVisibilityChange() {
      if (!document.hidden && !isCancelled) {
        void ping();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    return () => {
      isCancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
    };
  }, []);

  return null;
}
