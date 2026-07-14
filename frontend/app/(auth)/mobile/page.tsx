import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, LogIn } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DefinAm',
  themeColor: '#0A0F1E',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DefinAm',
  },
};

export default function MobileSplashPage() {
  return (
    <main className="min-h-dvh bg-ink flex flex-col items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center w-full max-w-[280px] md:max-w-[380px] text-center">

        {/* ── Logo mark ── */}
        <div className="w-[52px] h-[52px] bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <svg
            width="28"
            height="28"
            viewBox="0 0 38 38"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 28L15 8L22 22L27 14L34 28"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="19" cy="10" r="3" className="fill-white/50" />
          </svg>
        </div>

        {/* ── Wordmark ── */}
        <h1 className="font-bold text-[30px] md:text-[36px] font-black text-white tracking-[-1px] leading-none mb-2">
          DefinAm
        </h1>

        {/* ── Tagline ── */}
        <p className="text-[12px] md:text-[13px] text-white/40 leading-snug mb-3">
          Nigeria&apos;s AI learning brain
        </p>

        {/* ── Quote pill ── */}
        <div className="border border-white/[0.12] rounded-full px-4 py-1.5 mb-9 md:mb-11">
          <p className="text-[11px] md:text-[12px] text-white/30 italic">
            &ldquo;Knows what you&apos;ve forgotten before you do.&rdquo;
          </p>
        </div>

        {/* ── CTAs ── */}
        <div className="w-full flex flex-col gap-3">

          {/* Primary — Enter with Access Code */}
          <Link
            href="/mobile/code"
            className={[
              'min-h-[52px] w-full bg-card text-ink rounded-xl',
              'flex items-center justify-center gap-2.5',
              'text-[14px] md:text-[15px] font-bold tracking-tight',
              'hover:bg-white/90 active:scale-[0.985] transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
            ].join(' ')}
          >
            <KeyRound size={18} strokeWidth={2.2} aria-hidden />
            Enter with Access Code
          </Link>

          {/* Secondary — Login (Individual) */}
          <Link
            href="/login"
            className={[
              'min-h-[48px] w-full rounded-xl',
              'border border-white/[0.15] text-white/45',
              'flex items-center justify-center gap-2',
              'text-[13px] md:text-[14px] font-semibold tracking-tight',
              'hover:bg-white/[0.06] hover:text-white/65',
              'active:scale-[0.985] transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
            ].join(' ')}
          >
            <LogIn size={16} strokeWidth={2} aria-hidden />
            Login (Individual)
          </Link>

        </div>
      </div>
    </main>
  );
}
