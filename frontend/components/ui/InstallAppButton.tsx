'use client';

import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallAppButtonProps {
  /** Visual variant */
  variant?: 'solid' | 'outline' | 'ghost';
  className?: string;
}

/**
 * Shows a native "Add to Home Screen" button when the browser supports
 * the Web App install prompt AND the app hasn't been installed yet.
 * Renders nothing when already running in standalone mode or the browser
 * doesn't fire `beforeinstallprompt` (e.g. Safari iOS — prompt there is
 * manual via the Share sheet, so we keep the button hidden rather than
 * show a non-functional one).
 */
export function InstallAppButton({ variant = 'solid', className = '' }: InstallAppButtonProps) {
  const { canInstall, promptInstall } = usePWAInstall();

  if (!canInstall) return null;

  const base =
    'inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-[13px] font-bold transition-all active:scale-95';

  const variants: Record<string, string> = {
    solid: 'bg-ink text-white hover:bg-ink/90 shadow-md',
    outline: 'border border-ink text-ink hover:bg-ink/5',
    ghost: 'text-ink hover:bg-ink/5',
  };

  return (
    <button
      type="button"
      onClick={promptInstall}
      className={`${base} ${variants[variant]} ${className}`}
      aria-label="Install Recall as an app"
    >
      <Download size={15} strokeWidth={2} />
      Install App
    </button>
  );
}
