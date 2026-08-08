'use client';

import { motion } from 'framer-motion';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingStats from '@/components/landing/LandingStats';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingFaq from '@/components/landing/LandingFaq';
import HeroBackground from '@/components/landing/HeroBackground';
import SpotlightLink from '@/components/landing/SpotlightLink';
import { dmSans, bricolage } from '@/components/landing/landingFonts';

// Same fade-up shape used by LandingHero/LandingStats/LandingHowItWorks,
// scroll-triggered since this section is below the fold. Not currently
// exported/shared anywhere — each section defines its own copy, matching
// how the previous pieces of this redesign already did it.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

// ── Real data, verified against the live database ───────────────────────────
// Hardcoded (this is a static marketing page, not a live data integration),
// but confirmed against `get_all_subjects()` at implementation time — see
// frontend/docs for the exact query and date. Update these if the subject
// lineup or topic count changes materially.

const SUBJECTS = ['Mathematics', 'English Language', 'Chemistry', 'Physics', 'Economics'];

const INCLUDED = [
  {
    icon: IconChat,
    title: 'AI tutor, anytime',
    body: 'Stuck on something? Ask right there and get an explanation in plain language.',
  },
  {
    icon: IconBolt,
    title: 'Daily streaks',
    body: 'Build a habit of showing up. Every day you study counts, not just the days you finish something.',
  },
  {
    icon: IconChartLine,
    title: 'Progress you can see',
    body: 'Track exactly what you have covered, and what still needs work, subject by subject.',
  },
  {
    icon: IconClockHistory,
    title: 'Spaced recall built in',
    body: 'You do not have to plan your own revision schedule. Topics resurface exactly when you need them.',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-[#111827]">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingHowItWorks />

      {/* ═══════════════════ EVERYTHING YOU NEED IN ONE PLACE ═══════════════════ */}
      {/* Same dark ink→jade background as the hero (HeroBackground,
          `overlay="center"` since this section's content is centered, not
          left-anchored like the hero's). Content/layout below is otherwise
          untouched — this is a restyle, not a rebuild. */}
      <section className={`${dmSans.variable} ${bricolage.variable} relative overflow-hidden bg-[#0A0F1E]`}>
        <HeroBackground overlay="center" />
        <div className="relative z-10 mx-auto max-w-[1000px] px-6 py-11 sm:py-[70px]">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            custom={0}
            variants={fadeUp}
            className="font-heading mb-3 text-center text-[24px] font-extrabold tracking-[-0.02em] text-white sm:text-[30px]"
          >
            Everything you need in one place
          </motion.p>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            custom={1}
            variants={fadeUp}
            className="font-body mx-auto mb-8 max-w-[480px] text-center text-[14px] text-white/60 sm:mb-11 sm:text-[15px]"
          >
            No separate apps for practice, tutoring, and tracking progress.
          </motion.p>
          <div className="mx-auto grid max-w-[700px] grid-cols-1 gap-4 sm:grid-cols-2">
            {INCLUDED.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                custom={i + 2}
                variants={fadeUp}
                className="flex items-start gap-3.5 py-1.5"
              >
                {/* jade-tint-border (25% opacity, already in the design
                    system) instead of the light-mode jade-tint (10%) —
                    needs to read as "a slightly more visible tint" against
                    dark navy, per the brief. Glyph stays bright jade-light. */}
                <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-jade-tint-border text-jade-light">
                  <Icon />
                </div>
                <div>
                  <h4 className="font-heading mb-0.5 text-[14.5px] font-bold text-white">{title}</h4>
                  <p className="font-body text-[13px] leading-[1.5] text-white/60">{body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ SUBJECTS ══════════════════════════════ */}
      <section className="mx-auto max-w-[1000px] px-6 py-11 sm:py-[70px]">
        <p className="mb-3 text-center text-[24px] font-extrabold tracking-[-0.02em] text-[#0F1F17] sm:text-[30px]">
          All the subjects you actually need
        </p>
        <p className="mx-auto mb-8 max-w-[480px] text-center text-[14px] text-[#6B7280] sm:mb-11 sm:text-[15px]">
          Sciences, languages, and social sciences, all mapped to the official secondary school curriculum.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {SUBJECTS.map((subject) => (
            <span
              key={subject}
              className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13.5px] text-[#374151]"
            >
              {subject}
            </span>
          ))}
        </div>
      </section>

      <LandingPricing />
      <LandingFaq />

      {/* ══════════════════════════════ FOR SCHOOLS ══════════════════════════════ */}
      <section className="bg-[#0F1F17] px-6 py-11 text-center sm:py-[70px]">
        <p className="mb-3 text-[24px] font-extrabold tracking-[-0.02em] text-white sm:text-[30px]">
          Running a school? We have you covered
        </p>
        <p className="mx-auto mb-8 max-w-[480px] text-[14px] text-[#C7D2CB] sm:mb-11 sm:text-[15px]">
          Bulk access codes, a dashboard for your students, and reports your teachers will actually use.
        </p>
        {/* Routes to the purchase flow, not /admin/login: this band targets
            prospective schools who don't have an account yet, distinct from
            the nav's "For Schools" link (existing admins who already know to
            look for a login). Confirmed with the team rather than guessing,
            since /admin/login has no signup path and blindly matching the
            nav link here would leave new schools with no way to buy access
            from this page at all. */}
        <SpotlightLink href="/pay/organisation" className="inline-flex">
          Talk to us about school access
        </SpotlightLink>
      </section>

      {/* ══════════════════════════════ FOOTER ══════════════════════════════ */}
      <footer className="border-t border-[#E5E7EB] bg-white px-6 py-8 text-center">
        <p className="mb-1 text-[14px] font-bold text-[#111827]">Recall</p>
        <p className="mb-3 text-[13px] text-[#6B7280]">
          A modern study platform for secondary school students.
        </p>
        <p className="text-[12px] text-[#9CA3AF]">&copy; Recall 2026.</p>
      </footer>
    </div>
  );
}

// ── Icons — inlined close to the preview's hand-coded paths rather than
// swapped for lucide equivalents, so proportions match exactly. These are
// placeholder-quality illustrative icons, not meant for further polish. ──

function iconProps() {
  return {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    width: 22,
    height: 22,
  };
}

function IconChat() {
  return (
    <svg {...iconProps()} width={17} height={17}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg {...iconProps()} width={17} height={17}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
    </svg>
  );
}

function IconChartLine() {
  return (
    <svg {...iconProps()} width={17} height={17}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  );
}

function IconClockHistory() {
  return (
    <svg {...iconProps()} width={17} height={17}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
