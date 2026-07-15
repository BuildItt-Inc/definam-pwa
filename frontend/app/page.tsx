import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Repeat, BarChart3 } from 'lucide-react';
import LogoMark from '@/components/landing/LogoMark';

export const metadata: Metadata = {
  title: 'DefinAm — Study smarter for WAEC, NECO and JAMB',
  description:
    'DefinAm helps Nigerian secondary school students study smarter using spaced repetition, Nigerian examples, and AI-powered practice.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DefinAm',
  },
  openGraph: {
    title: 'DefinAm',
    description: 'Study smarter for WAEC, NECO and JAMB.',
    url: 'https://definam.ng',
    siteName: 'DefinAm',
    locale: 'en_NG',
    type: 'website',
  },
};

export const viewport: Viewport = {};

// Subjects covered
const SUBJECTS = ['Mathematics', 'English Language', 'Chemistry', 'Physics', 'Economics', 'Biology'];

// How it works steps
const HOW_STEPS = [
  {
    icon: BookOpen,
    title: 'Learn with context',
    body: 'Every topic is taught with a clear definition, a Nigerian real-world example, and a visual breakdown — not just blocks of text.',
  },
  {
    icon: Repeat,
    title: 'Daily recall keeps it fresh',
    body: 'Topics you study come back for review right before you would naturally forget them. Short, targeted and automatic.',
  },
  {
    icon: BarChart3,
    title: 'Track what you know',
    body: 'Your accuracy, streak, and upcoming reviews are all in one place so you can see exactly where you stand.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#111827]" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="font-bold text-[16px] text-[#111827] tracking-tight">DefinAm</span>
          </Link>

          <div className="flex items-center gap-3">
            <a href="#how-it-works" className="hidden sm:block text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors">
              How it works
            </a>
            <Link href="/login" className="text-[14px] font-medium text-[#111827] hover:text-[#16A34A] transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link
              href="/pay/individual"
              className="bg-[#111827] text-white text-[14px] font-semibold px-4 py-2 rounded-lg hover:bg-[#1F2937] active:scale-[0.97] transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-[#16A34A] mb-4">
          Built for Nigerian secondary school students
        </p>
        <h1 className="text-[38px] sm:text-[52px] font-extrabold text-[#111827] leading-[1.1] tracking-tight mb-5 max-w-[640px]">
          Study less.<br />Remember more.
        </h1>
        <p className="text-[17px] text-[#6B7280] leading-relaxed max-w-[480px] mb-8">
          DefinAm turns your WAEC and JAMB syllabus into short lessons, Nigerian examples, and a daily review system that keeps everything in your head.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pay/individual"
            className="inline-flex items-center gap-2 bg-[#16A34A] text-white text-[15px] font-semibold px-6 py-3.5 rounded-xl hover:bg-[#15803D] active:scale-[0.97] transition-all shadow-[0_2px_8px_rgba(22,163,74,0.25)]"
          >
            Start for free
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 bg-[#F3F4F6] text-[#111827] text-[15px] font-semibold px-6 py-3.5 rounded-xl hover:bg-[#E5E7EB] active:scale-[0.97] transition-all"
          >
            How it works
          </a>
        </div>

        {/* Trust pills */}
        <div className="flex flex-wrap gap-2 mt-8">
          {['WAEC aligned', 'NECO aligned', 'JAMB aligned'].map((label) => (
            <span
              key={label}
              className="text-[12px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1 rounded-full"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#E5E7EB]" />

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
          How it works
        </p>
        <h2 className="text-[28px] sm:text-[34px] font-extrabold text-[#111827] tracking-tight mb-12 max-w-[500px] leading-tight">
          A system built around how memory works
        </h2>

        <div className="grid sm:grid-cols-3 gap-8">
          {HOW_STEPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center flex-shrink-0">
                <Icon size={20} strokeWidth={2} className="text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#111827] mb-1.5">{title}</h3>
                <p className="text-[14px] text-[#6B7280] leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subject coverage */}
      <div className="border-t border-[#E5E7EB]" />
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-[20px] font-bold text-[#111827] mb-6 text-center">
          Covers every core WAEC subject
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {SUBJECTS.map((subject) => (
            <span
              key={subject}
              className="text-[13px] font-medium text-[#374151] border border-[#D1D5DB] px-4 py-1.5 rounded-full hover:border-[#16A34A] hover:text-[#16A34A] transition-colors cursor-default"
            >
              {subject}
            </span>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-16">
        <div className="bg-[#111827] rounded-2xl px-8 py-12 text-center">
          <h2 className="text-[26px] sm:text-[32px] font-extrabold text-white tracking-tight mb-3">
            Start before your next exam
          </h2>
          <p className="text-[15px] text-white/60 mb-8 max-w-[360px] mx-auto">
            Join students who are preparing with method, not just hours.
          </p>
          <Link
            href="/pay/individual"
            className="inline-flex items-center gap-2 bg-white text-[#111827] text-[15px] font-bold px-7 py-3.5 rounded-xl hover:bg-gray-100 active:scale-[0.97] transition-all"
          >
            Get started
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-semibold text-[14px] text-[#111827]">DefinAm</span>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#how-it-works" className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">How it works</a>
            <Link href="/pay/organisation" className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">For schools</Link>
            <Link href="/login" className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors">Sign in</Link>
          </nav>

          <p className="text-[12px] text-[#9CA3AF]">
            &copy; DefinAm 2026. Made in Nigeria.
          </p>
        </div>
      </footer>
    </div>
  );
}
