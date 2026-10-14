'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';


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
    <section id="schools" className="relative overflow-hidden bg-ink px-6 py-16 sm:py-24">
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

      <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
      <div className="min-w-0">
        <motion.h2
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={0}
          variants={fadeUp}
          className="font-heading mb-3 text-[1.625rem] font-extrabold tracking-[-0.02em] text-white sm:text-[2.125rem]"
        >
          Running a school? We&apos;ve got you covered.
        </motion.h2>
        <motion.p
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={1}
          variants={fadeUp}
          className="font-body mb-8 text-[0.875rem] text-white/85 sm:mb-10 sm:text-[0.9375rem]"
        >
          Bulk access codes, a dashboard for your students, and reports your teachers will
          actually use.
        </motion.p>
        <motion.div initial={false} whileInView="visible" viewport={{ once: true, amount: 0.6 }} custom={2} variants={fadeUp}>
          <Link
            href="/pay/organisation"
            className="inline-flex items-center justify-center rounded-md bg-cream px-7 py-3.5 text-[0.9375rem] font-bold text-ink transition-colors hover:bg-white active:scale-[0.97]"
          >
            Get school access
          </Link>
        </motion.div>
        <p className="font-body mt-4 text-white/85">Already a school administrator? <Link href="/admin/login" className="font-semibold text-white underline underline-offset-4">Log in</Link></p>
      </div>
      <figure className="min-w-0 rounded-3xl border border-white/15 bg-white/5 p-5">
        <Image src="/hero-mockup-cropped.png" alt="Recall school analytics dashboard and student interface" width={1000} height={954} className="h-auto w-full" sizes="(min-width: 1024px) 440px, 90vw" />
        <figcaption className="mt-4 text-center text-sm leading-relaxed text-white/80">School dashboard preview. The data shown is illustrative.</figcaption>
      </figure>
      </div>
    </section>
  );
}
