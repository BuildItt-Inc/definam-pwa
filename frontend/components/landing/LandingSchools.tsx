'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { dmSans, bricolage } from '@/components/landing/landingFonts';

// Same fade-up shape used across the other sections, scroll-triggered.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function LandingSchools() {
  return (
    <section className={`${dmSans.variable} ${bricolage.variable} relative overflow-hidden bg-ink px-6 py-16 text-center sm:py-24`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/schools-cta.webp')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(17,24,39,0.88) 0%, rgba(17,24,39,0.74) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[560px]">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={0}
          variants={fadeUp}
          className="font-heading mb-3 text-[26px] font-extrabold tracking-[-0.02em] text-white sm:text-[34px]"
        >
          Running a school? We&apos;ve got you covered.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={1}
          variants={fadeUp}
          className="font-body mb-8 text-[14px] text-white/85 sm:mb-10 sm:text-[15px]"
        >
          Bulk access codes, a dashboard for your students, and reports your teachers will
          actually use.
        </motion.p>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.6 }} custom={2} variants={fadeUp}>
          <Link
            href="/pay/organisation"
            className="inline-flex items-center justify-center rounded-md bg-cream px-7 py-3.5 text-[15px] font-bold text-ink transition-colors hover:bg-white active:scale-[0.97]"
          >
            Talk to us about school access
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
