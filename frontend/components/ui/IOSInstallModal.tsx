'use client';

import { X, Share, Plus, ChevronRight } from 'lucide-react';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center animate-fade-in">
      {/* Backdrop close area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div 
        className="relative z-10 w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl animate-slide-up sm:max-w-md border border-border-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-bg-1 text-ink/70 hover:bg-bg-2 active:scale-95 transition-all"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="mb-6 text-center">
          <h2 className="text-[18px] font-extrabold text-ink">Install Recall on iOS</h2>
          <p className="mt-1 text-[13px] text-muted">
            Add Recall to your home screen in just a few taps.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-jade">
              <Share size={18} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-ink">1. Open Safari Share menu</p>
              <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                Tap the Share icon in Safari&apos;s bottom toolbar (or top right on iPad).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-ink">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-ink">2. Add to Home Screen</p>
              <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                Scroll down the share list and select <span className="font-semibold text-ink">&quot;Add to Home Screen&quot;</span>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white shadow-sm">
              <span className="text-[12px] font-extrabold">Add</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-ink">3. Confirm Installation</p>
              <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                Tap <span className="font-semibold text-ink">&quot;Add&quot;</span> in the top-right corner to finish.
              </p>
            </div>
          </div>
        </div>

        {/* Got it Button */}
        <button
          onClick={onClose}
          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-3.5 text-[14.5px] font-bold text-white shadow-md active:scale-95 transition-all"
        >
          Got it
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
