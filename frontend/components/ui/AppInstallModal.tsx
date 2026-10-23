'use client';

import { useEffect, useState } from 'react';
import { X, Share, Plus, ChevronRight, MoreVertical, Download, ExternalLink } from 'lucide-react';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppInstallModal({ isOpen, onClose }: AppInstallModalProps) {
  const [platform, setPlatform] = useState<'ios' | 'samsung' | 'chrome' | 'inapp' | 'generic'>('generic');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isInApp = /FBAN|FBAV|Instagram|WhatsApp|Snapchat|Line|wv/i.test(ua);
    const isSamsung = /SamsungBrowser/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isInApp) {
      setPlatform('inapp');
    } else if (isIOS) {
      setPlatform('ios');
    } else if (isSamsung) {
      setPlatform('samsung');
    } else if (isAndroid) {
      setPlatform('chrome');
    } else {
      setPlatform('generic');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center animate-fade-in">
      {/* Backdrop click area */}
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
          aria-label="Close install modal"
        >
          <X size={18} />
        </button>

        {/* In-App Browser Detected */}
        {platform === 'inapp' && (
          <div>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                <ExternalLink size={22} />
              </div>
              <h2 className="text-[17.5px] font-extrabold text-ink">Open in Main Browser</h2>
              <p className="mt-1 text-[13px] text-muted leading-snug">
                You are viewing Recall inside another app (e.g. WhatsApp or Instagram). To install, open in your phone&apos;s browser first.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-ink">
                  <MoreVertical size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">1. Tap the 3 dots menu</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Tap the <strong>⋮</strong> icon in the top right or bottom corner.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-emerald-600">
                  <ExternalLink size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">2. Open in Chrome or Samsung Internet</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Select <strong>&quot;Open in Chrome&quot;</strong> or <strong>&quot;Open in external browser&quot;</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Samsung Internet Browser on Galaxy devices */}
        {platform === 'samsung' && (
          <div>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Download size={22} />
              </div>
              <h2 className="text-[17.5px] font-extrabold text-ink">Install on Samsung Galaxy</h2>
              <p className="mt-1 text-[13px] text-muted leading-snug">
                Add Recall to your home screen using Samsung Internet:
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-emerald-600">
                  <Download size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">Method A: Address Bar Icon</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Look at the top URL bar and tap the small <strong>Download arrow (↓)</strong> next to the web address.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-ink">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">Method B: Browser Menu</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Tap the <strong>☰</strong> menu (bottom right) → tap <strong>&quot;Add page to&quot;</strong> → choose <strong>&quot;App screen&quot;</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chrome on Android */}
        {platform === 'chrome' && (
          <div>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Download size={22} />
              </div>
              <h2 className="text-[17.5px] font-extrabold text-ink">Install on Android</h2>
              <p className="mt-1 text-[13px] text-muted leading-snug">
                Add Recall to your home screen in two quick steps:
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-ink">
                  <MoreVertical size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">1. Open Chrome menu</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Tap the three dots <strong>⋮</strong> in the top-right corner of Chrome.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-emerald-600">
                  <Download size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">2. Tap &quot;Install app&quot;</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Select <strong>&quot;Install app&quot;</strong> (or <strong>&quot;Add to Home screen&quot;</strong>) and tap <strong>Install</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* iOS (iPhone/iPad) */}
        {platform === 'ios' && (
          <div>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Share size={22} />
              </div>
              <h2 className="text-[17.5px] font-extrabold text-ink">Install Recall on iPhone</h2>
              <p className="mt-1 text-[13px] text-muted leading-snug">
                Apple requires installing to Home Screen for app mode &amp; notifications:
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-emerald-600">
                  <Share size={18} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">1. Tap Safari Share icon</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Tap the <strong>Share</strong> button (box with upward arrow ⎋) in Safari&apos;s bottom toolbar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border-2 text-ink">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">2. Select &quot;Add to Home Screen&quot;</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Scroll down and tap <strong>&quot;Add to Home Screen&quot; ⊞</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-bg-1 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white shadow-sm">
                  <span className="text-[12px] font-extrabold">Add</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">3. Tap &quot;Add&quot; at top right</p>
                  <p className="text-[11.5px] text-muted mt-0.5 leading-snug">
                    Tap <strong>Add</strong> to complete. Then open Recall directly from your iPhone home screen!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generic Fallback */}
        {platform === 'generic' && (
          <div>
            <div className="mb-5 text-center">
              <h2 className="text-[17.5px] font-extrabold text-ink">Install Recall App</h2>
              <p className="mt-1 text-[13px] text-muted leading-snug">
                Install Recall on your device for fast, one-tap study access.
              </p>
            </div>
            <p className="rounded-xl bg-bg-1 p-3 text-center text-[12.5px] text-muted leading-relaxed">
              Open your browser menu (<strong>⋮</strong> or <strong>☰</strong>) and select <strong>&quot;Install App&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
            </p>
          </div>
        )}

        {/* Got it Button */}
        <button
          onClick={onClose}
          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-3 text-[14px] font-bold text-white shadow-md active:scale-95 transition-all"
        >
          Got it
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
