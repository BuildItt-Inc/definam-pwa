'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import HeroBackground from './HeroBackground';

function revealQuestion(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const question = document.getElementById('sample-question');
  if (!question) return;
  question.focus({ preventScroll: true });
  question.scrollIntoView({ behavior: 'instant', block: 'start' });
  // The normal anchor action still updates the URL and supports no-JS navigation.
}

export default function LandingHero() {
  return (
    <section id="home" className="relative overflow-hidden bg-[#0A0F1E]">
      <HeroBackground />
      <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-9 px-6 pb-14 pt-28 sm:px-7 sm:pb-20 sm:pt-32 lg:grid-cols-2 lg:gap-12">
        <div className="min-w-0">
          <h1 className="font-heading mb-5 text-[clamp(2.125rem,4vw,3rem)] font-bold leading-[1.12] text-white">
            <span className="block">Study smarter.</span><span className="block">Remember longer.</span>
          </h1>
          <p className="font-body mb-6 max-w-[460px] text-white/80">Master every subject in your secondary school curriculum. Learn with clear explanations, real-world examples, and an AI tutor.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/join" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 py-3 text-[0.9375rem] font-semibold text-white hover:bg-brand-dark">Enter school code <ArrowRight size={18} aria-hidden /></Link>
            <Link href="/pay/individual" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-[0.9375rem] font-semibold text-white hover:bg-white/10">Get individual access</Link>
          </div>
          <p className="font-body mt-4 text-sm text-white/75">Already have access? <Link href="/login" className="font-semibold text-white underline underline-offset-4">Log in</Link></p>
          <a href="#sample-question" onClick={revealQuestion} className="inline-flex min-h-11 items-center gap-2 font-semibold text-jade-light underline underline-offset-4">Try a free question <ArrowRight size={17} aria-hidden /></a>
        </div>
        <div className="min-w-0 rounded-3xl border border-white/15 bg-white p-6 text-ink shadow-xl sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-brand-dark"><BookOpen size={18} aria-hidden /> Sample lesson</span>
            <span className="rounded-full bg-bg-2 px-3 py-1 text-xs font-medium">Mathematics</span>
          </div>
          <h2 className="font-heading mb-3 font-bold">Make equations click.</h2>
          <p className="font-body text-muted">An equation is a balance. Whatever you do to one side, do to the other.</p>
          <div className="my-5 rounded-2xl bg-bg-0 px-5 py-4">
            <p className="mb-2 text-sm font-medium text-muted">Solve for x</p>
            <p className="text-[1.75rem] font-bold tracking-tight">2x + 3 = 11</p>
            <p className="mt-2 text-base text-ink-2">Subtract 3, then divide by 2. <strong>x = 4.</strong></p>
          </div>
          <p className="mb-5 flex items-start gap-2 text-sm text-ink-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-dark" aria-hidden /> Learn the idea. Check your understanding. Review it again.</p>
          <a href="#sample-question" onClick={revealQuestion} className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-dark underline underline-offset-4">Try a free practice question <ArrowRight size={17} aria-hidden /></a>
        </div>
      </div>
    </section>
  );
}
