import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, LogIn, User } from 'lucide-react';

export const metadata: Metadata = {
  title: "DefinAm — Nigeria's AI Learning Brain",
  description:
    'AI-powered study tool for Nigerian secondary school students. WAEC, NECO, JAMB prep with spaced repetition.',
  manifest: '/manifest.json',
  themeColor: '#0A0F1E',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DefinAm',
  },
  openGraph: {
    title: 'DefinAm',
    description: "Nigeria's AI learning brain for secondary school students.",
    url: 'https://definam.ng',
    siteName: 'DefinAm',
    locale: 'en_NG',
    type: 'website',
  },
};

export default function LandingPage() {
  return (
    <main
      className={[
        'min-h-screen bg-ink font-dm-sans',
        'flex flex-col items-center justify-center',
        'px-4 py-16',
        'md:[background-image:radial-gradient(circle_at_50%_30%,rgba(27,107,74,0.25)_0%,transparent_65%)]',
      ].join(' ')}
    >
      <div className="w-full max-w-[480px] flex flex-col items-center text-center">

        {/* ── Logo mark ── */}
        <div className="w-[52px] h-[52px] md:w-16 md:h-16 bg-jade rounded-2xl flex items-center justify-center mb-5 shadow-lg">
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
            <circle cx="19" cy="10" r="3" fill="#24A06E" />
          </svg>
        </div>

        {/* ── Wordmark ── */}
        <h1 className="font-syne text-[30px] md:text-[34px] font-black text-white tracking-[-0.8px] leading-none mb-3">
          DefinAm
        </h1>

        {/* ── Tagline ── */}
        <p className="text-[13px] text-white/40 leading-snug mb-2 max-w-[260px]">
          Nigeria&apos;s AI learning brain for secondary school students
        </p>

        {/* ── Quote ── */}
        <p className="text-[12px] text-white/25 italic mb-10">
          &ldquo;Knows what you&apos;ve forgotten before you do.&rdquo;
        </p>

        {/* ── CTAs ── */}
        <div className="w-full flex flex-col gap-3">

          {/* Button 1 — Individual (jade) */}
          <Link
            href="/pay/individual"
            className={[
              'min-h-[56px] w-full bg-jade text-white rounded-xl px-4',
              'flex items-center gap-3',
              'hover:bg-jade/90 active:scale-[0.985] transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-jade focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
            ].join(' ')}
          >
            <User
              size={20}
              strokeWidth={2}
              className="flex-shrink-0"
              aria-hidden
            />
            <div className="flex-1 text-left">
              <div className="text-[14px] font-extrabold leading-tight">
                Pay as an Individual
              </div>
              <div className="text-[11px] font-normal text-white/60 mt-0.5">
                Personal subscription · ₦1,700/term
              </div>
            </div>
            <ArrowRight
              size={16}
              strokeWidth={2}
              className="flex-shrink-0 text-white/60"
              aria-hidden
            />
          </Link>

          {/* Button 2 — Organisation (ghost) */}
          <Link
            href="/pay/organisation"
            className={[
              'min-h-[56px] w-full rounded-xl px-4',
              'bg-white/[0.08] border border-white/[0.15] text-white',
              'flex items-center gap-3',
              'hover:bg-white/[0.13] active:scale-[0.985] transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
            ].join(' ')}
          >
            <Building2
              size={20}
              strokeWidth={2}
              className="flex-shrink-0"
              aria-hidden
            />
            <div className="flex-1 text-left">
              <div className="text-[14px] font-extrabold leading-tight">
                Pay as an Organisation
              </div>
              <div className="text-[11px] font-normal text-white/60 mt-0.5">
                Schools · Bulk seats · Admin dashboard
              </div>
            </div>
            <ArrowRight
              size={16}
              strokeWidth={2}
              className="flex-shrink-0 text-white/60"
              aria-hidden
            />
          </Link>

          {/* Button 3 — Login (tertiary) */}
          <Link
            href="/login"
            className={[
              'min-h-[48px] w-full rounded-xl px-4',
              'bg-transparent border border-white/[0.12] text-white/50',
              'flex items-center justify-center gap-2',
              'hover:bg-white/[0.05] hover:text-white/70',
              'active:scale-[0.985] transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
            ].join(' ')}
          >
            <LogIn size={16} strokeWidth={2} aria-hidden />
            <span className="text-[13px] font-semibold">Login</span>
          </Link>

        </div>
      </div>
    </main>
  );
}
