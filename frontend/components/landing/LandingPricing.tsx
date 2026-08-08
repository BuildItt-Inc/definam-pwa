'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { dmSans, bricolage } from '@/components/landing/landingFonts';

// One plan, not tiers — no "Most Popular" badge, since that framing only
// makes sense when there's something to compare against. Real features of
// the app, not generic pricing-page filler.
const BENEFITS = [
  'Every subject in your curriculum, fully unlocked',
  'AI tutor — ask anything, anytime, in plain language',
  'Spaced recall so topics come back before you forget',
  'Practice questions with full worked explanations',
  "Progress tracking — see what you've mastered and what needs work",
  'Daily streaks to build the study habit',
];

// Same fade-up shape used across the other sections, scroll-triggered.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/**
 * Pricing — single confident card, no tier comparison. Light `cream`
 * section: the page's actual neighbor before this is "Subjects" (light,
 * untouched by this redesign), not the dark "Everything you need" section
 * a few sections up, so cream both distinguishes this section from the
 * plain-white one right before it and still contrasts against the dark
 * "For Schools" band right after.
 */
export default function LandingPricing() {
  return (
    <section
      id="pricing"
      className={`${dmSans.variable} ${bricolage.variable} bg-cream px-6 py-14 sm:py-20`}
    >
      <div className="mx-auto max-w-[520px] text-center">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={0}
          variants={fadeUp}
          className="font-body mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-jade sm:text-[12px]"
        >
          Pricing
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={1}
          variants={fadeUp}
          className="font-heading mb-3 text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]"
        >
          Simple, honest pricing
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={2}
          variants={fadeUp}
          className="font-body text-[14px] text-muted sm:text-[15px]"
        >
          One price per term. Everything included.
        </motion.p>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        custom={3}
        variants={fadeUp}
        className="mx-auto mt-10 max-w-[420px] rounded-3xl border border-border bg-white p-7 shadow-md sm:mt-14 sm:p-9"
      >
        <p className="font-body mb-1.5 text-[13px] text-muted">Individual student</p>

        <p className="font-heading mb-1 flex items-baseline gap-1.5 text-[38px] font-extrabold tracking-[-0.02em] text-ink sm:text-[44px]">
          ₦1,700
          <span className="font-body text-[15px] font-medium text-muted">/ term</span>
        </p>

        <p className="font-body mb-6 text-[13.5px] leading-[1.5] text-muted">
          Full access to every subject and the AI tutor for the term. Renew to keep your access
          going.
        </p>

        <ul className="mb-7 flex flex-col gap-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-jade-tint text-jade">
                <Check size={12} strokeWidth={3} aria-hidden />
              </span>
              <span className="font-body text-left text-[13.5px] leading-[1.45] text-ink">{benefit}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/pay/individual"
          className="flex w-full items-center justify-center rounded-xl bg-jade px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-jade-dark active:scale-[0.97]"
        >
          Get Started
        </Link>
      </motion.div>
    </section>
  );
}
