'use client';

import { motion } from 'framer-motion';
import { BookOpen, ClipboardCheck, RotateCcw } from 'lucide-react';
import { dmSans, bricolage } from '@/components/landing/landingFonts';

// The real 3-step model — this is what the app genuinely does, not
// marketing filler. "Review it later" (not "Recall it later"): the in-app
// spaced-repetition feature was deliberately renamed from "Recall" to
// "Review" so it wouldn't collide with the product itself being named
// Recall — see docs/WEEK18_LANDING_PAGE_REDESIGN.md.
const STEPS = [
  {
    step: 'STEP 1',
    icon: BookOpen,
    title: 'Learn it clearly',
    body: 'A plain definition, a real world example, and a visual breakdown for every topic — not walls of text to re-read.',
  },
  {
    step: 'STEP 2',
    icon: ClipboardCheck,
    title: 'Practice it',
    body: 'Exam-style questions with full explanations, so you understand exactly why an answer is right, not just that it is.',
  },
  {
    step: 'STEP 3',
    icon: RotateCcw,
    title: 'Review it later',
    body: 'Spaced repetition brings topics back right before you would naturally start forgetting them.',
  },
];

// Same fade-up shape used in LandingHero/LandingStats, scroll-triggered
// (`whileInView`) since this section is below the fold.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/**
 * "How It Works" — centered intro + 3 step cards. No explicit background
 * (inherits the page's white), continuing the light body straight through
 * from LandingStats' cream strip, per the established alternating rhythm
 * of the sections below the hero.
 */
export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className={`${dmSans.variable} ${bricolage.variable} px-6 py-14 sm:py-20`}>
      <div className="mx-auto max-w-[520px] text-center">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={0}
          variants={fadeUp}
          className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-jade sm:text-[12px]"
        >
          The Process
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={1}
          variants={fadeUp}
          className="font-heading mb-3 text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]"
        >
          How It Works
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={2}
          variants={fadeUp}
          className="font-body text-[14px] text-muted sm:text-[15px]"
        >
          Every topic broken into a simple flow that actually sticks.
        </motion.p>
      </div>

      <div className="mx-auto mt-10 grid max-w-[1000px] grid-cols-1 gap-5 sm:mt-14 sm:grid-cols-3">
        {STEPS.map(({ step, icon: Icon, title, body }, i) => (
          <motion.div
            key={title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            custom={i}
            variants={fadeUp}
            className="rounded-2xl border border-border bg-white p-6 shadow-xs transition-shadow duration-200 hover:shadow-sm sm:p-7"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-jade-tint text-jade">
              <Icon size={20} strokeWidth={1.8} aria-hidden />
            </div>
            <p className="font-body mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {step}
            </p>
            <h3 className="font-heading mb-2 text-[17px] font-bold tracking-[-0.01em] text-ink">{title}</h3>
            <p className="font-body text-[14px] leading-[1.55] text-muted">{body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
