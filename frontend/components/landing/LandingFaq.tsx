'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { dmSans, bricolage } from '@/components/landing/landingFonts';

// Real, current answers — no stale "DefinAm" copy. See
// docs/WEEK12_RENAME_TO_RECALL.md for the product's rename history.
const FAQS = [
  {
    question: 'What is Recall?',
    answer:
      'Recall is a study platform for Nigerian secondary school students. Every topic in your curriculum is broken into a clear explanation, a real-world example, practice questions, and spaced review — plus an AI tutor you can ask anything, anytime.',
  },
  {
    question: 'How much does it cost?',
    answer:
      '₦1,700 per term for individual students — full access to every subject and the AI tutor. Schools can get bulk access for their students; reach out through "For Schools".',
  },
  {
    question: 'Do I need to download it from an app store?',
    answer:
      'No. Recall is a progressive web app — open it in your browser and tap "Install App" to add it to your home screen. It works like a native app, no app store needed.',
  },
  {
    question: 'What subjects are covered?',
    answer: 'Your core secondary school subjects, mapped to the curriculum, with more being added regularly.',
  },
  {
    question: 'How does the spaced review work?',
    answer:
      "After you study a topic, Recall schedules it to come back for a quick review right before you'd naturally forget it — so what you learn actually sticks through to exam day. You don't have to plan any of it yourself.",
  },
  {
    question: 'Can my school use Recall for a whole class?',
    answer:
      'Yes. Schools get bulk access codes for students plus a dashboard to track class progress. Use the "Talk to us about school access" option to get set up.',
  },
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
 * FAQ — single-column accordion, one question open at a time (there was
 * no pre-existing accordion anywhere in the codebase to match behavior
 * against — grepped the whole frontend, not just landing — so this picks
 * the more common single-open pattern rather than allow-multiple).
 *
 * No explicit background (inherits the page's white) — the section right
 * before this, LandingPricing, is `cream`, so staying white here keeps the
 * light/dark alternation going into the dark "For Schools" band after it.
 */
export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faqs" className={`${dmSans.variable} ${bricolage.variable} px-6 py-14 sm:py-20`}>
      <div className="mx-auto max-w-[520px] text-center">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={0}
          variants={fadeUp}
          className="font-body mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-jade sm:text-[12px]"
        >
          Questions
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          custom={1}
          variants={fadeUp}
          className="font-heading text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]"
        >
          Frequently Asked Questions
        </motion.h2>
      </div>

      <div className="mx-auto mt-10 max-w-[640px] sm:mt-14">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <motion.div
              key={faq.question}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              custom={i + 2}
              variants={fadeUp}
              className="border-b border-border"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-heading text-[15px] font-bold text-ink sm:text-[16px]">
                  {faq.question}
                </span>
                {/* Plus rotated 45° reads as an "×" when open — same idea as a
                    +/− toggle without needing two separately-swapped icons. */}
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-jade-tint text-jade transition-transform duration-200 ${
                    isOpen ? 'rotate-45' : ''
                  }`}
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="font-body pb-5 pr-10 text-[13.5px] leading-[1.6] text-muted">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
