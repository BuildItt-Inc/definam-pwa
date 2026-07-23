'use client';

import { Toaster } from 'sonner';

/**
 * Mounted once in the root layout. Corner toasts only — auto-dismissing,
 * non-blocking feedback (completion, recall done, errors). Bigger,
 * higher-emotional-weight moments (login, streak, payment) use
 * CelebrationOverlay instead, not this.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors={false}
      closeButton={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex items-start gap-2.5 w-full rounded-xl border px-4 py-3 shadow-lg bg-card text-[14px] font-medium',
          title: 'text-ink font-semibold',
          description: 'text-muted text-[13px]',
          success: 'border-brand/25 [&_[data-icon]]:text-brand',
          error: 'border-danger/25 [&_[data-icon]]:text-danger',
          info: 'border-border-2 [&_[data-icon]]:text-ink',
        },
      }}
    />
  );
}
