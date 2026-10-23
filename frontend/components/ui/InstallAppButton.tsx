'use client';

import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { AppInstallModal } from '@/components/ui/AppInstallModal';

interface InstallAppButtonProps {
  /** Visual variant */
  variant?: 'solid' | 'outline' | 'ghost';
  className?: string;
  label?: string;
}

/**
 * Universal Install App Button for Android (Chrome, Samsung Internet) and iOS (Safari).
 * Always accessible when the user is on mobile and hasn't yet installed Recall.
 */
export function InstallAppButton({
  variant = 'solid',
  className = '',
  label = 'Install App',
}: InstallAppButtonProps) {
  const {
    canInstall,
    isInstalled,
    promptInstall,
    showInstallModal,
    setShowInstallModal,
  } = usePWAInstall();

  // If already installed, hide the button
  if (isInstalled || !canInstall) return null;

  const base =
    'inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-[13px] font-bold transition-all active:scale-95';

  const variants: Record<string, string> = {
    solid: 'bg-ink text-white hover:bg-ink/90 shadow-md',
    outline: 'border border-ink text-ink hover:bg-ink/5',
    ghost: 'text-ink hover:bg-ink/5',
  };

  return (
    <>
      <button
        type="button"
        onClick={promptInstall}
        className={`${base} ${variants[variant]} ${className}`}
        aria-label="Install Recall as an app"
      >
        <Download size={15} strokeWidth={2} />
        {label}
      </button>

      <AppInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </>
  );
}
