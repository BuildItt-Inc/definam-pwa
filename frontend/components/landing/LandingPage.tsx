'use client';

import { useSpotlight } from '@/hooks/useSpotlight';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingStats from '@/components/landing/LandingStats';
import SpotlightLink from '@/components/landing/SpotlightLink';

// ── Real data, verified against the live database ───────────────────────────
// Hardcoded (this is a static marketing page, not a live data integration),
// but confirmed against `get_all_subjects()` at implementation time — see
// frontend/docs for the exact query and date. Update these if the subject
// lineup or topic count changes materially.

const SUBJECTS = ['Mathematics', 'English Language', 'Chemistry', 'Physics', 'Economics'];

// ── How it works — "Review it later" (not "Recall it later"): the in-app
// spaced-repetition feature was renamed from "Recall" to "Review" when the
// app itself was renamed to Recall, specifically to avoid this exact
// collision (a feature called the same thing as the product). Using
// "Recall it later" here would reintroduce that confusion on the page most
// likely to be a new visitor's first impression, so the copy below says
// "Review" throughout — flagged explicitly per the brief's request rather
// than picked silently.
const HOW_STEPS = [
  {
    step: 'STEP 1',
    accent: 'bg-[#E9FBF0] text-[#16A34A]',
    icon: IconIllustration,
    title: 'Learn it clearly',
    body: 'A plain definition, a real world example, and a visual breakdown for every topic, not walls of text to re-read.',
  },
  {
    step: 'STEP 2',
    accent: 'bg-[#EFF6FF] text-[#2563EB]',
    icon: IconPracticeIllustration,
    title: 'Practice it',
    body: 'Exam style questions with full explanations, so you understand exactly why an answer is right, not just that it is.',
  },
  {
    step: 'STEP 3',
    accent: 'bg-[#FDF4E7] text-[#D97706]',
    icon: IconReviewIllustration,
    title: 'Review it later',
    body: 'Spaced repetition brings topics back right before you would naturally start forgetting them.',
  },
];

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

      {/* ══════════════════════════ HOW IT WORKS ══════════════════════════ */}
      <section id="how-it-works" className="mx-auto max-w-[1000px] px-6 py-11 sm:py-[70px]">
        <p className="mb-3 text-center text-[24px] font-extrabold tracking-[-0.02em] text-[#0F1F17] sm:text-[30px]">
          How it works
        </p>
        <p className="mx-auto mb-8 max-w-[480px] text-center text-[14px] text-[#6B7280] sm:mb-11 sm:text-[15px]">
          Every topic broken into a simple flow that actually sticks.
        </p>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-5">
          {HOW_STEPS.map(({ step, accent, icon: Icon, title, body }) => (
            <SpotlightCard key={title}>
              <span className="absolute right-[22px] top-[22px] text-[11px] font-bold tracking-[0.06em] text-[#C4CBC5]">
                {step}
              </span>
              <div className={`mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-xl ${accent}`}>
                <Icon />
              </div>
              <h3 className="mb-2 text-[17px] tracking-[-0.01em] text-[#111827]">
                <span className="font-bold">{title}</span>
              </h3>
              <p className="text-[14px] leading-[1.55] text-[#6B7280]">{body}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ═══════════════════ EVERYTHING YOU NEED IN ONE PLACE ═══════════════════ */}
      <section className="bg-[#F4FAF6]">
        <div className="mx-auto max-w-[1000px] px-6 py-11 sm:py-[70px]">
          <p className="mb-3 text-center text-[24px] font-extrabold tracking-[-0.02em] text-[#0F1F17] sm:text-[30px]">
            Everything you need in one place
          </p>
          <p className="mx-auto mb-8 max-w-[480px] text-center text-[14px] text-[#6B7280] sm:mb-11 sm:text-[15px]">
            No separate apps for practice, tutoring, and tracking progress.
          </p>
          <div className="mx-auto grid max-w-[700px] grid-cols-1 gap-4 sm:grid-cols-2">
            {INCLUDED.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3.5 py-1.5">
                <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-[#E9FBF0] text-[#16A34A]">
                  <Icon />
                </div>
                <div>
                  <h4 className="mb-0.5 text-[14.5px] font-bold text-[#111827]">{title}</h4>
                  <p className="text-[13px] leading-[1.5] text-[#6B7280]">{body}</p>
                </div>
              </div>
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

      {/* ══════════════════════════════ PRICING ══════════════════════════════ */}
      <section id="pricing" className="bg-[#F4FAF6]">
        <div className="mx-auto max-w-[1000px] px-6 py-11 sm:py-[70px]">
          <p className="mb-3 text-center text-[24px] font-extrabold tracking-[-0.02em] text-[#0F1F17] sm:text-[30px]">
            Simple, honest pricing
          </p>
          <p className="mx-auto mb-8 max-w-[480px] text-center text-[14px] text-[#6B7280] sm:mb-11 sm:text-[15px]">
            One price per term. Everything included.
          </p>
          <SpotlightCard className="mx-auto max-w-[380px] p-6 text-center sm:p-[30px]">
            <p className="mb-1.5 text-[13px] text-[#6B7280]">Individual student</p>
            <p className="mb-1 mt-1.5 text-[34px] font-extrabold text-[#0F1F17] sm:text-[40px]">
              N1,700<span className="text-[15px] font-semibold text-[#6B7280]"> / term</span>
            </p>
            <p className="mb-5 text-[13px] text-[#6B7280]">
              Full access to every subject and the AI tutor for the term. Renew to keep your access going.
            </p>
            <SpotlightLink href="/pay/individual" filled className="block w-full">
              Get started
            </SpotlightLink>
          </SpotlightCard>
        </div>
      </section>

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

// ── Reusable spotlight-hover primitive — SpotlightLink now lives in
// SpotlightLink.tsx (shared with LandingNav); SpotlightCard stays local
// since only this file's sections use it so far. ──────────────────────────

function SpotlightCard({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();
  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={`spotlight spotlight-card relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-[26px] transition-[transform,box-shadow,border-color] duration-200 ${className}`}
    >
      <div className="relative z-10">{children}</div>
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

function IconIllustration() {
  return (
    <svg {...iconProps()}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconPracticeIllustration() {
  return (
    <svg {...iconProps()}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconReviewIllustration() {
  return (
    <svg {...iconProps()}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
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
