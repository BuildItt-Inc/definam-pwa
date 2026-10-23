'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingStats from '@/components/landing/LandingStats';
import LandingSample from '@/components/landing/LandingSample';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingFaq from '@/components/landing/LandingFaq';
import LandingSchools from '@/components/landing/LandingSchools';
import LandingFooter from '@/components/landing/LandingFooter';
import HeroBackground from '@/components/landing/HeroBackground';


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
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      // When launched from Home Screen as an installed app, open the student workspace
      if (isStandalone) {
        const hasProfile = !!localStorage.getItem('recall_student_profile');
        if (hasProfile) {
          router.replace('/student');
        }
      }
    }
  }, [router]);
  return (
    <MotionConfig reducedMotion="user">
    <div className="landing-page bg-white text-ink">
      <a href="#main-content" className="landing-skip-link">Skip to content</a>
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
      <LandingHero />
      <LandingStats />
      <LandingSample />
      <LandingHowItWorks />

      {/* ═══════════════════ EVERYTHING YOU NEED IN ONE PLACE ═══════════════════ */}
      {/* Same dark ink→jade background as the hero (HeroBackground,
          `overlay="center"` since this section's content is centered, not
          left-anchored like the hero's). Content/layout below is otherwise
          untouched — this is a restyle, not a rebuild. */}
      <section className={`relative overflow-hidden bg-[#0A0F1E]`}>
        <HeroBackground overlay="center" />
        <div className="relative z-10 mx-auto max-w-[1000px] px-6 py-11 sm:py-[70px]">
          <motion.h2
            initial={false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            custom={0}
            variants={fadeUp}
            className="font-heading mb-3 text-center text-[1.5rem] font-extrabold tracking-[-0.02em] text-white sm:text-[1.875rem]"
          >
            Everything you need in one place
          </motion.h2>
          <motion.p
            initial={false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            custom={1}
            variants={fadeUp}
            className="font-body mx-auto mb-8 max-w-[480px] text-center text-[0.875rem] text-white/60 sm:mb-11 sm:text-[0.9375rem]"
          >
            No separate apps for practice, tutoring, and tracking progress.
          </motion.p>
          <div className="mx-auto grid max-w-[700px] grid-cols-1 gap-4 sm:grid-cols-2">
            {INCLUDED.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={false}
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
                  <h3 className="font-heading mb-0.5 text-[0.9063rem] font-bold text-white">{title}</h3>
                  <p className="font-body text-[0.8125rem] leading-[1.5] text-white/60">{body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <LandingPricing />
      <LandingFaq />
      <LandingSchools />
      </main>
      <LandingFooter />
    </div>
    </MotionConfig>
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
