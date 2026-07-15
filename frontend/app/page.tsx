import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import PatternGlyphs from '@/components/landing/PatternGlyphs';
import MobileNav from '@/components/landing/MobileNav';
import LogoMark from '@/components/landing/LogoMark';

export const metadata: Metadata = {
  title: "DefinAm — Nigeria's AI Learning Brain",
  description:
    'AI-powered study tool for Nigerian secondary school students. WAEC, NECO, JAMB prep with spaced repetition.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
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

export const viewport: Viewport = {
};

// ─── Glyph data ───────────────────────────────────────────────────────────────

const heroGlyphs = [
  { text: 'H₂O', top: '6%',  left: '74%', rotate: -12, size: 42, color: 'rgba(27,107,74,0.07)' },
  { text: 'π',   top: '72%', left: '4%',  rotate: 15,  size: 50, color: 'rgba(200,151,58,0.08)' },
  { text: 'λ',   top: '12%', left: '2%',  rotate: 8,   size: 30, color: 'rgba(27,107,74,0.06)' },
  { text: 'x²',  top: '82%', left: '80%', rotate: -10, size: 36, color: 'rgba(200,151,58,0.08)' },
  { text: '₦',   top: '42%', left: '93%', rotate: 5,   size: 34, color: 'rgba(27,107,74,0.06)' },
];

const howItWorksGlyphs = [
  { text: 'CO₂', top: '6%',  left: '18%', rotate: -8,  size: 34, color: 'rgba(27,107,74,0.06)' },
  { text: 'DNA', top: '8%',  left: '86%', rotate: 10,  size: 28, color: 'rgba(200,151,58,0.08)' },
  { text: '√x',  top: '60%', left: '90%', rotate: -6,  size: 40, color: 'rgba(27,107,74,0.06)' },
  { text: 'Aa',  top: '88%', left: '12%', rotate: 12,  size: 32, color: 'rgba(200,151,58,0.08)' },
  { text: 'π',   top: '92%', left: '70%', rotate: 4,   size: 26, color: 'rgba(27,107,74,0.05)' },
];

const subjectsGlyphs = [
  { text: 'x²',  top: '8%',  left: '9%',  rotate: -10, size: 38, color: 'rgba(27,107,74,0.06)' },
  { text: 'λ',   top: '70%', left: '88%', rotate: 8,   size: 34, color: 'rgba(200,151,58,0.08)' },
  { text: 'H₂O', top: '12%', left: '90%', rotate: 12,  size: 30, color: 'rgba(27,107,74,0.06)' },
  { text: '₦',   top: '78%', left: '14%', rotate: -6,  size: 32, color: 'rgba(200,151,58,0.08)' },
];

const ctaGlyphs = [
  { text: 'x²',  top: '12%', left: '8%',  rotate: -10, size: 44, color: 'rgba(255,255,255,0.10)' },
  { text: 'H₂O', top: '66%', left: '86%', rotate: 8,   size: 38, color: 'rgba(255,255,255,0.12)' },
  { text: 'λ',   top: '18%', left: '88%', rotate: -6,  size: 32, color: 'rgba(255,255,255,0.10)' },
  { text: 'π',   top: '74%', left: '10%', rotate: 10,  size: 30, color: 'rgba(255,255,255,0.09)' },
];

// ─── Orbit illustration ────────────────────────────────────────────────────────
function OrbitIllustration() {
  return (
    <svg
      viewBox="0 0 320 320"
      className="w-full max-w-[280px] mx-auto"
      aria-hidden="true"
    >
      {/* Ambient glow */}
      <circle cx="160" cy="160" r="150" fill="#1B6B4A" fillOpacity="0.04" />

      {/* Rotating group — orbit-cw */}
      <g
        style={{ transformOrigin: '160px 160px' }}
        className="animate-orbit-cw"
      >
        {/* Dashed ring */}
        <circle
          cx="160"
          cy="160"
          r="130"
          fill="none"
          stroke="rgba(10,15,30,0.12)"
          strokeDasharray="2 6"
        />

        {/* Connector lines */}
        <line x1="160" y1="160" x2="160" y2="30"  stroke="rgba(10,15,30,0.15)" strokeDasharray="3 3" />
        <line x1="160" y1="160" x2="290" y2="160" stroke="rgba(10,15,30,0.15)" strokeDasharray="3 3" />
        <line x1="160" y1="160" x2="160" y2="290" stroke="rgba(10,15,30,0.15)" strokeDasharray="3 3" />
        <line x1="160" y1="160" x2="30"  y2="160" stroke="rgba(10,15,30,0.15)" strokeDasharray="3 3" />

        {/* Top node — x² — jade */}
        <g style={{ transformOrigin: '160px 30px' }} className="animate-orbit-ccw">
          <circle cx="160" cy="30" r="26" fill="#1B6B4A" />
          <text
            x="160" y="35"
            textAnchor="middle"
            fill="white"
            fontWeight="bold"
            fontSize="15"
            fontFamily="serif"
          >
            x²
          </text>
        </g>

        {/* Right node — H₂O — gold */}
        <g style={{ transformOrigin: '290px 160px' }} className="animate-orbit-ccw">
          <circle cx="290" cy="160" r="26" fill="#C8973A" />
          <text
            x="290" y="165"
            textAnchor="middle"
            fill="#412402"
            fontWeight="bold"
            fontSize="13"
            fontFamily="sans-serif"
          >
            H₂O
          </text>
        </g>

        {/* Bottom node — λ — coral */}
        <g style={{ transformOrigin: '160px 290px' }} className="animate-orbit-ccw">
          <circle cx="160" cy="290" r="26" fill="#E85D3A" />
          <text
            x="160" y="296"
            textAnchor="middle"
            fill="white"
            fontWeight="bold"
            fontSize="18"
            fontFamily="serif"
          >
            λ
          </text>
        </g>

        {/* Left node — Aa — jade-light */}
        <g style={{ transformOrigin: '30px 160px' }} className="animate-orbit-ccw">
          <circle cx="30" cy="160" r="26" fill="#5DCAA5" />
          <text
            x="30" y="165"
            textAnchor="middle"
            fill="#0F3D2C"
            fontWeight="bold"
            fontSize="14"
            fontFamily="sans-serif"
          >
            Aa
          </text>
        </g>
      </g>

      {/* Static core */}
      <circle cx="160" cy="160" r="58" fill="#0F3D2C" stroke="#5DCAA5" strokeWidth="1.5" />
      {/* Gold sparkle */}
      <path
        d="M160 130 L166 154 L190 160 L166 166 L160 190 L154 166 L130 160 L154 154 Z"
        fill="#C8973A"
      />
    </svg>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-card text-ink">

      {/* ── 1. Sticky nav ── */}
      <header className="sticky top-0 z-10 bg-card border-b border-cream">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <LogoMark size={28} />
            <span className="font-bold font-bold text-[17px] text-ink">DefinAm</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-[13px] text-ink-2 hover:text-ink transition-colors"
            >
              How it works
            </a>
            <Link
              href="/pay/organisation"
              className="text-[13px] text-ink-2 hover:text-ink transition-colors"
            >
              For schools
            </Link>
            <Link
              href="/login"
              className="text-[13px] text-ink-2 hover:text-ink transition-colors"
            >
              Login
            </Link>
            <div className="hidden md:block">
              <Link
                href="/pay/individual"
                className="btn-primary px-4 py-2 text-[14px] flex items-center gap-1.5 rounded-lg"
              >
                Get Started
                <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
              </Link>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </nav>
      </header>

      {/* ── 2. Hero ── */}
      <section className="relative overflow-hidden bg-card">
        <PatternGlyphs glyphs={heroGlyphs} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* Eyebrow */}
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-2-dark">
              AI study coach for WAEC, NECO and JAMB
            </p>

            {/* Headline */}
            <h1 className="font-bold text-[40px] md:text-[56px] font-extrabold text-ink leading-[1.1] tracking-tight">
              Learn it once.<br />
              <span className="text-ink">Never forget it again.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-[14px] text-ink-2 leading-relaxed max-w-[400px]">
              DefinAm turns your syllabus into Nigerian examples, quick practice,
              and daily recall — so nothing you study fades before exam day.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/pay/individual"
                className="btn-primary px-6 py-3.5 text-[15px] flex items-center gap-2 shadow-brand-sm rounded-xl"
              >
                Get started
                <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary px-6 py-3.5 text-[15px] flex items-center gap-2 bg-transparent border-0 shadow-none hover:bg-bg-1 rounded-xl"
              >
                <PlayCircle size={18} strokeWidth={2.5} aria-hidden />
                See how it works
              </a>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2">
              {['WAEC aligned', 'NECO aligned', 'JAMB aligned'].map((label) => (
                <span
                  key={label}
                  className="bg-bg-1 border border-border-2 text-ink text-[12px] font-bold px-3 py-1 rounded-[16px]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right column — orbit */}
          <div className="flex items-center justify-center">
            <OrbitIllustration />
          </div>
        </div>
      </section>

      {/* ── 3. How it works ── */}
      <section id="how-it-works" className="relative overflow-hidden bg-card">
        <PatternGlyphs glyphs={howItWorksGlyphs} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          {/* Intro */}
          <div className="w-full md:w-1/2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink mb-3">
              How it works
            </p>
            <h2 className="font-bold font-extrabold text-[22px] md:text-[26px] text-ink">
              Built around how you actually remember
            </h2>
          </div>

          {/* Row 1 — image left, text right */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-16 md:mb-24">
            {/* Card */}
            <div className="w-full md:w-1/2 mt-8 md:mt-0 relative">
            {/* Mockup card */}
            <div className="bg-bg-1 border border-border-2 rounded-[24px] p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                {/* Progress strip */}
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-[16px] ${i < 2 ? 'bg-ink' : 'bg-border-2'}`}
                    />
                  ))}
                </div>
                </div>
                <span className="self-start bg-bg-0 border border-border-2 text-ink text-[11px] font-bold px-3 py-1.5 rounded-[16px]">
                  Topic 2 of 4
                </span>
                {/* Body */}
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  A trader at Alaba Market solves P = −2x² + 20x − 30 to find
                  her break-even point — a quadratic equation, same as your WAEC
                  paper.
                </p>
                {/* Caption */}
                <p className="text-[11px] text-muted">Step 2 of 5 · Nigerian example</p>
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold font-extrabold text-[20px] md:text-[22px] text-ink">
                Every topic, five ways in
              </h3>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                Definition, Nigerian example, visual breakdown, practice, then an
                AI tutor that asks questions instead of just giving answers. No
                topic is one flat page of text.
              </p>
            </div>
          </div>

          {/* Row 2 — text left, image right */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Text */}
            <div className="flex flex-col gap-4 md:order-1">
              <h3 className="font-bold font-extrabold text-[20px] md:text-[22px] text-ink">
                Nothing fades. Ever.
              </h3>
              <p className="text-[14px] text-ink-2 leading-relaxed">
                Every topic you study gets scheduled for review right before
                you&apos;d naturally forget it. Your streak, your accuracy, your
                weak spots — tracked automatically.
              </p>
            </div>

            {/* Card */}
            <div className="bg-ink-2-tint rounded-2xl p-6 md:order-2">
              <div className="bg-card rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                {/* Stats */}
                <div className="flex gap-6">
                  <div className="mb-2">
                    <p className="text-[11px] text-muted font-semibold uppercase tracking-widest">
                      Exam Prediction
                    </p>
                    <p className="text-[28px] font-bold text-ink leading-none">71%</p>
                  </div>
                  <div>
                    <p className="text-[28px] font-bold text-ink leading-none">8</p>
                    <p className="text-[11px] text-muted mt-0.5">day streak</p>
                  </div>
                </div>
                {/* Decorative heatmap */}
                <div className="flex flex-wrap gap-1">
                  {[
                    '#EEEEEE','#9FE1CB','#1B6B4A','#EEEEEE','#5DCAA5',
                    '#085041','#9FE1CB','#EEEEEE','#1B6B4A','#5DCAA5',
                    '#EEEEEE','#085041','#9FE1CB','#1B6B4A',
                  ].map((color, i) => (
                    <div
                      key={i}
                      style={{ width: 9, height: 9, backgroundColor: color, borderRadius: 2 }}
                    />
                  ))}
                </div>
                {/* Caption */}
                <p className="text-[11px] text-muted">Next review: tomorrow</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Subject coverage ── */}
      <section className="relative overflow-hidden border-t border-cream bg-card py-12 md:py-16">
        <PatternGlyphs glyphs={subjectsGlyphs} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-6">
          <h2 className="font-bold font-extrabold text-[20px] text-ink text-center">
            Built for every WAEC subject
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {['Mathematics', 'English Language', 'Chemistry', 'Physics', 'Economics', 'Biology'].map((subject) => (
              <span
                key={subject}
                className="text-[11px] font-semibold text-[#555] border border-[#E0DDD8] px-[14px] py-[6px] rounded-full"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Closing CTA band ── */}
      <section className="relative overflow-hidden bg-ink py-16 md:py-20 text-white rounded-[24px] mx-4 md:mx-auto max-w-7xl mb-8">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-bold font-extrabold text-[22px] md:text-[26px] text-white">
            Start learning today
          </h2>
          <p className="text-[15px] text-white/75 max-w-[360px] mx-auto mb-8 mt-4">
            Join students preparing smarter for WAEC, NECO and JAMB.
          </p>
          <div className="flex justify-center">
            <Link
              href="/pay/individual"
              className="bg-white text-ink text-[15px] font-bold px-6 py-3.5 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
            >
              Get started
              <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Footer ── */}
      <footer className="border-t border-cream bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-3 gap-10">
          {/* Col 1 — brand */}
          <div className="flex flex-col gap-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <LogoMark size={22} />
              <span className="font-bold font-bold text-[15px] text-ink">DefinAm</span>
            </div>
            <p className="text-[13px] text-muted leading-relaxed max-w-[220px]">
              Nigeria&apos;s AI learning brain for WAEC, NECO and JAMB.
            </p>
          </div>

          {/* Col 2 — Product */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
              Product
            </p>
            <nav className="flex flex-col gap-2">
              <a href="#how-it-works" className="text-[14px] text-ink-2 hover:text-ink transition-colors w-fit">
                How it works
              </a>
              <span className="text-[14px] text-muted cursor-default">Pricing</span>
              <Link href="/pay/organisation" className="text-[14px] text-ink-2 hover:text-ink transition-colors w-fit">
                For schools
              </Link>
            </nav>
          </div>

          {/* Col 3 — Company */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
              Company
            </p>
            <nav className="flex flex-col gap-2">
              <span className="text-[14px] text-muted cursor-default">Contact</span>
              <span className="text-[14px] text-muted cursor-default">Privacy policy</span>
              <span className="text-[14px] text-muted cursor-default">Terms of service</span>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-cream max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <p className="text-[12px] text-muted">© DefinAm 2026 · Made in Nigeria</p>
        </div>
      </footer>
    </div>
  );
}
