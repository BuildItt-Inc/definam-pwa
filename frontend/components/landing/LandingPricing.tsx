'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';


// ── Pricing constants ────────────────────────────────────────────────────
// Match backend/app/services/payment_service.py. Both checkout routes
// send the selected term count; one term corresponds to 120 days.
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
          <span className="font-body text-left text-[0.8438rem] leading-[1.45] text-ink">{benefit}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Individual access: fixed-period purchases, selected via the terms query.
 * Explain activation and expiry next to the offer, before checkout.
 */
export default function LandingPricing() {
  return (
    <section
      id="pricing"
      className={`bg-cream px-6 py-14 sm:py-20`}
    >
      <div className="mx-auto max-w-[520px] text-center">
        <motion.p
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={0}
          variants={fadeUp}
          className="font-body mb-3 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-brand-dark sm:text-[0.75rem]"
        >
          Pricing
        </motion.p>
        <motion.h2
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={1}
          variants={fadeUp}
          className="font-heading mb-3 text-[1.625rem] font-extrabold tracking-[-0.02em] text-ink sm:text-[2.125rem]"
        >
          Simple, honest pricing
        </motion.h2>
        <motion.p
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={2}
          variants={fadeUp}
          className="font-body text-[0.875rem] text-muted sm:text-[0.9375rem]"
        >
          One price per term. Everything included.
        </motion.p>
        <p className="font-body mt-3 text-muted">One term is 120 days. Three terms give you 360 days of access.</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-[900px] gap-6 sm:mt-14 md:grid-cols-2 md:items-stretch md:gap-7">
        {/* ── Card 1 — Single Term ── */}
        <motion.div
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={3}
          variants={fadeUp}
          className="flex flex-col rounded-3xl border border-border bg-white p-7 shadow-md sm:p-9"
        >
          <p className="font-body mb-1.5 text-[0.8125rem] text-muted">Single term</p>
          <p className="mb-3 text-sm font-medium text-brand-dark">120 days from code activation</p>
          <p className="mb-4 text-sm text-muted">For one student on one device.</p>

          <p className="font-heading mb-1 flex items-baseline gap-1.5 text-[2.375rem] font-extrabold tracking-[-0.02em] text-ink sm:text-[2.75rem]">
            {formatNaira(TERM_PRICE)}
            <span className="font-body text-[0.9375rem] font-medium text-muted">/ term</span>
          </p>

          <p className="font-body mb-6 text-[0.8438rem] leading-[1.5] text-muted">
            Full access to every subject and the AI tutor for one term. Renew to keep your
            access going.
          </p>

          <BenefitList items={BENEFITS} />

          <Link
            href="/pay/individual?terms=1"
            className="mt-auto flex w-full items-center justify-center rounded-md bg-brand-dark px-6 py-3.5 text-[0.9375rem] font-bold text-white transition-colors hover:bg-green-900 active:scale-[0.97]"
          >
            Get individual access
          </Link>
        </motion.div>

        {/* ── Card 2 — 3 Terms (emphasized) ── */}
        <motion.div
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={4}
          variants={fadeUp}
          className="relative flex flex-col rounded-3xl border-2 border-jade bg-white p-7 shadow-lg sm:scale-[1.03] sm:p-9"
        >
          {/* Savings badge */}
          <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-dark px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wide text-white shadow-sm">
            <Sparkles size={12} strokeWidth={2.5} aria-hidden />
            Save {BUNDLE_SAVINGS_PCT}%
          </span>

          <p className="font-body mb-1.5 mt-1.5 text-[0.8125rem] text-muted">3 terms</p>
          <p className="mb-3 text-sm font-medium text-brand-dark">360 days from code activation</p>
          <p className="mb-4 text-sm text-muted">For one student on one device.</p>

          <div className="mb-1 flex items-baseline gap-2">
            <p className="font-heading flex items-baseline gap-1.5 text-[2.375rem] font-extrabold tracking-[-0.02em] text-ink sm:text-[2.75rem]">
              {formatNaira(BUNDLE_TOTAL)}
              <span className="font-body text-[0.9375rem] font-medium text-muted">/ 3 terms</span>
            </p>
          </div>
          <p className="font-body mb-6 text-[0.8125rem] text-muted">
            <span className="line-through">{formatNaira(BUNDLE_FULL_PRICE)}</span>{' '}
            <span className="font-semibold text-brand-dark">
              you save {formatNaira(BUNDLE_FULL_PRICE - BUNDLE_TOTAL)}
            </span>
          </p>

          <p className="font-body mb-6 text-[0.8438rem] leading-[1.5] text-muted">
            Everything in Single Term, for three terms. Our best value option.
          </p>

          <BenefitList items={BENEFITS} />

          <Link
            href="/pay/individual?terms=3"
            className="mt-auto flex w-full items-center justify-center rounded-md bg-brand-dark px-6 py-3.5 text-[0.9375rem] font-bold text-white transition-colors hover:bg-green-900 active:scale-[0.97]"
          >
            Get 3 terms of access
          </Link>
        </motion.div>
      </div>
      <div className="mx-auto mt-8 max-w-[900px] rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-3 font-semibold text-ink">How your access works</h3>
        <p className="font-body mb-3 font-medium text-ink">Individual access is for one student on one device.</p>
        <p className="font-body text-muted">Pay once for your chosen period. After payment is confirmed, your personal access code is emailed to you. Use it to register your account and activate access.</p>
        <p className="font-body mt-3 text-muted">Your access period starts when you activate the code, and expires after 120 or 360 days. Unused codes must also be activated before their expiry date. There is no recurring charge; continued access requires another purchase.</p>
      </div>
    </section>
  );
}
