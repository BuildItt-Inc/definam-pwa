'use client';

import { motion } from 'framer-motion';
import { dmSans, bricolage } from '@/components/landing/landingFonts';

// Real, verified numbers — confirmed against `get_all_subjects()` per
// docs/WEEK18_LANDING_PAGE_REDESIGN.md (queried 2026-07-25): 5 real
// subjects, 1,277 real topics at the time. "1,200+" is a deliberate floor
// below that count, not the exact number, so it won't go stale the moment
// a topic is added. AI tutor availability is a real product feature (no
// scheduled downtime), not a placeholder claim.
const STATS = [
  { value: '5', label: 'subjects covered' },
  { value: '1,200+', label: 'topics and growing' },
  { value: '24/7', label: 'AI tutor availability' },
];

// Same fade-up shape as LandingHero's `fadeUp`, but triggered by
// `whileInView` rather than `animate` — this strip sits below the fold and
// isn't on screen at initial load, so the animation should fire on scroll.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/**
 * Quiet confidence-builder strip directly below the hero — light `cream`
 * background on the white/cream body that follows the dark hero. Bricolage
 * numbers (`font-heading`), DM Sans labels (`font-body`), ink/muted text —
 * design-system tokens throughout, no new hex.
 *
 * Plain `grid-cols-3` at every breakpoint: with only 3 stats and short
 * labels, a simple 3-up row reads clean even at narrow widths (a label
 * wrapping to 2 lines under its number is fine — it's still uncramped).
 */
export default function LandingStats() {
  return (
    <section className={`${dmSans.variable} ${bricolage.variable} border-b border-border bg-cream`}>
      <div className="mx-auto grid max-w-[700px] grid-cols-3 gap-4 px-6 py-10 text-center sm:gap-6 sm:py-12">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeUp}
          >
            <div className="font-heading text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]">
              {stat.value}
            </div>
            <div className="font-body mt-1.5 text-[11.5px] leading-snug text-muted sm:text-[13px]">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
