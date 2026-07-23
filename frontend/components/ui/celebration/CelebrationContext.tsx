'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CelebrationOverlay } from './CelebrationOverlay';

export type CelebrationPayload =
  | { type: 'login'; name: string }
  | { type: 'streak'; days: number }
  | { type: 'payment'; email: string; accessCode: string; onRedirect: () => void };

interface CelebrationContextValue {
  celebrate: (payload: CelebrationPayload) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function useCelebration(): CelebrationContextValue {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return ctx;
}

/**
 * Mounted once in the root layout. Full-screen, centered celebrations for
 * higher-emotional-weight / lower-frequency moments: login, streak,
 * payment success. Anything else (completion, errors) should use the
 * corner toast (lib/toast.ts) instead.
 */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<CelebrationPayload | null>(null);

  const celebrate = useCallback((payload: CelebrationPayload) => {
    setActive(payload);
  }, []);

  const dismiss = useCallback(() => setActive(null), []);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      {active && <CelebrationOverlay payload={active} onDismiss={dismiss} />}
    </CelebrationContext.Provider>
  );
}
