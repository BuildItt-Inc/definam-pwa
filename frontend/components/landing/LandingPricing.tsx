'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { dmSans, bricolage } from '@/components/landing/landingFonts';

// ── Pricing constants ────────────────────────────────────────────────────
// Dev-preview build, ahead of backend term-billing support. Single source
// of truth for every price/badge/total shown below — once the backend
// adds a term param to the payment request, only these constants (plus
// the CTA hrefs, marked below) need to change.
const TERM_PRICE = 2000;
const BUNDLE_TERMS = 3;
const BUNDLE_DISCOUNT = 0.15;
const BUNDLE_FULL_PRICE = TERM_PRICE * BUNDLE_TERMS;
const BUNDLE_TOTAL = Math.round(BUNDLE_FULL_PRICE * (1 - BUNDLE_DISCOUNT));
const BUNDLE_SAVINGS_PCT = BUNDLE_DISCOUNT * 100;

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

// Real features of the app, not generic pricing-page filler.
const BENEFITS = [
  'Every subject in your curriculum, fully unlocked',
  'AI tutor. Ask anything, anytime, in plain language',
  'Spaced recall so topics come back before you forget',
  'Practice questions with full worked explanations',
  "Progress tracking. See what you've mastered and what needs work",
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

function BenefitList({ items }: { items: string[] }) {
  return (
    <ul className="mb-7 flex flex-col gap-3">
      {items.map((benefit) => (
        <li key={benefit} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-jade-tint text-jade">
            <Check size={12} strokeWidth={3} aria-hidden />
          </span>
          <span className="font-body text-left text-[13.5px] leading-[1.45] text-ink">{benefit}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Pricing — two cards: a single-term plan and a 3-term bundle. Light
 * `cream` section: the page's actual neighbor before this is "Subjects"
 * (light, untouched by this redesign), not the dark "Everything you need"
 * section a few sections up, so cream both distinguishes this section from
 * the plain-white one right before it and still contrasts against the dark
 * "For Schools" band right after.
 *
 * Dev-preview: CTAs both point at the existing /pay/individual flow (the
 * only one that exists today). The 3-term card's href is marked TODO —
 * swap it for a term-aware route/param once the backend supports
 * multi-term purchases (see docs recon: access is a single expires_at,
 * always a fixed one-term lifespan, with no term-count concept yet).
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

      <div className="mx-auto mt-10 grid max-w-[900px] gap-6 sm:mt-14 md:grid-cols-2 md:items-stretch md:gap-7">
        {/* ── Card 1 — Single Term ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={3}
          variants={fadeUp}
          className="flex flex-col rounded-3xl border border-border bg-white p-7 shadow-md sm:p-9"
        >
          <p className="font-body mb-1.5 text-[13px] text-muted">Single term</p>

          <p className="font-heading mb-1 flex items-baseline gap-1.5 text-[38px] font-extrabold tracking-[-0.02em] text-ink sm:text-[44px]">
            {formatNaira(TERM_PRICE)}
            <span className="font-body text-[15px] font-medium text-muted">/ term</span>
          </p>

          <p className="font-body mb-6 text-[13.5px] leading-[1.5] text-muted">
            Full access to every subject and the AI tutor for one term. Renew to keep your
            access going.
          </p>

          <BenefitList items={BENEFITS} />

          <Link
            href="/pay/individual?terms=1"
            className="mt-auto flex w-full items-center justify-center rounded-md bg-jade px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-jade-dark active:scale-[0.97]"
          >
            Get Started
          </Link>
        </motion.div>

        {/* ── Card 2 — 3 Terms (emphasized) ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={4}
          variants={fadeUp}
          className="relative flex flex-col rounded-3xl border-2 border-jade bg-white p-7 shadow-lg sm:scale-[1.03] sm:p-9"
        >
          {/* Savings badge */}
          <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-jade px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
            <Sparkles size={12} strokeWidth={2.5} aria-hidden />
            Save {BUNDLE_SAVINGS_PCT}%
          </span>

          <p className="font-body mb-1.5 mt-1.5 text-[13px] text-muted">3 terms</p>

          <div className="mb-1 flex items-baseline gap-2">
            <p className="font-heading flex items-baseline gap-1.5 text-[38px] font-extrabold tracking-[-0.02em] text-ink sm:text-[44px]">
              {formatNaira(BUNDLE_TOTAL)}
              <span className="font-body text-[15px] font-medium text-muted">/ 3 terms</span>
            </p>
          </div>
          <p className="font-body mb-6 text-[13px] text-muted">
            <span className="line-through">{formatNaira(BUNDLE_FULL_PRICE)}</span>{' '}
            <span className="font-semibold text-jade">
              you save {formatNaira(BUNDLE_FULL_PRICE - BUNDLE_TOTAL)}
            </span>
          </p>

          <p className="font-body mb-6 text-[13.5px] leading-[1.5] text-muted">
            Everything in Single Term, for three terms. Our best value option.
          </p>

          <BenefitList items={BENEFITS} />

          <Link
            href="/pay/individual?terms=3"
            className="mt-auto flex w-full items-center justify-center rounded-md bg-jade px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-jade-dark active:scale-[0.97]"
          >
            Get 3 Terms
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
