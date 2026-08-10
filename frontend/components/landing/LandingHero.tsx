'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import HeroPhoneMockup from '@/components/landing/HeroPhoneMockup';
import HeroBackground from '@/components/landing/HeroBackground';
import { dmSans, bricolage } from '@/components/landing/landingFonts';
import { usePwaInstall } from '@/hooks/usePwaInstall';

// Staggered fade-up — each element ~0.1s behind the last, per the brief.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/**
 * Dark hero — layered ink/jade background (see HeroBackground), mobile-first
 * stack → `lg:` two-column (copy left, phone right). `pt-28`/`sm:pt-32`
 * clears LandingNav, which is `fixed` (see that file's comment).
 */
export default function LandingHero() {
  const { canInstall, promptInstall } = usePwaInstall();

  return (
    <section
      id="home"
      className={`${dmSans.variable} ${bricolage.variable} relative overflow-hidden bg-[#0A0F1E]`}
    >
      <HeroBackground />

      <div className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-28 sm:px-7 sm:pb-24 sm:pt-32 lg:grid-cols-2 lg:gap-16 lg:pb-28">
        {/* Copy column — left-aligned at every breakpoint, per the Figma
            (previously centered below `lg:`, which is what needed fixing) */}
        <div className="flex flex-col items-start text-left">
          {/* <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-body mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-jade-light sm:text-[12px]"
          >
            A modern study platform for Nigerian secondary school students
          </motion.p> */}

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-heading mb-4 max-w-[540px] text-[32px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white sm:text-[48px] lg:max-w-none"
          >
            Study 
            <br />
            smarter.
            <br />
            Remember
            <br />
            longer.
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-body mb-7 max-w-[460px] text-[15px] leading-relaxed text-white/60 sm:text-[16px]"
          >
            Master every subject in your secondary school curriculum with clear explanations, real
            world examples, and an AI tutor built to help you actually retain what you learn.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-body flex w-full max-w-xs flex-col gap-2.5 sm:w-auto sm:max-w-none sm:flex-row sm:gap-3.5"
          >
            <Link
              href="/pay/individual"
              className="inline-flex items-center justify-center rounded-lg bg-jade px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-jade-dark active:scale-[0.97] sm:px-7 sm:text-[16px]"
            >
              Get Started
            </Link>
            {/* Only rendered once `beforeinstallprompt` has actually fired —
                browsers that don't support installable PWAs (Safari) or an
                already-installed app never fire it, so `canInstall` just
                stays false and this button never appears rather than
                showing a control that would do nothing on click. */}
            {canInstall && (
              <button
                type="button"
                onClick={promptInstall}
                className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white/40 active:scale-[0.97] sm:px-7 sm:text-[16px]"
              >
                Install App
              </button>
            )}
          </motion.div>
        </div>

        {/* Phone mockup column — content unchanged, just staggered in */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="w-full lg:flex lg:justify-end"
        >
          <HeroPhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}
