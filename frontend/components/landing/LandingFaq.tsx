'use client';



import { Plus } from 'lucide-react';


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
      '₦2,000 per term for individual students, or ₦5,100 for three terms. One term is 120 days; three terms is 360 days. Your access period starts when you activate your code. Full access to every subject and the AI tutor. Schools can get bulk access for their students through "Get school access".',
  },
  {
    question: 'Do I need to download it from an app store?',
    answer:
      'No. Recall is a progressive web app. Open it in your browser and tap "Install App" to add it to your home screen. It works like a native app, no app store needed.',
  },
  {
    question: 'What subjects are covered?',
    answer: 'Your core secondary school subjects, mapped to the curriculum, with more being added regularly.',
  },
  {
    question: 'How does the spaced review work?',
    answer:
      "After you study a topic, Recall schedules it to come back for a quick review right before you'd naturally forget it. So what you learn actually sticks through to exam day. You don't have to plan any of it yourself.",
  },
  {
    question: 'Can my school use Recall for a whole class?',
    answer:
      'Yes. Schools get bulk access codes for students plus a dashboard to track class progress. Use the "Get school access" option to get set up.',
  },
];

export default function LandingFaq() {
  return (
    <section id="faqs" aria-labelledby="faq-heading" className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-[520px] text-center">
        <p className="font-body mb-3 text-xs font-bold uppercase tracking-widest text-brand-dark">Questions</p>
        <h2 id="faq-heading" className="font-heading font-bold text-ink">Frequently Asked Questions</h2>
      </div>
      <div className="mx-auto mt-10 max-w-[640px]">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group border-b border-border">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 font-semibold text-ink">{faq.question}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-jade-tint text-brand-dark transition-transform group-open:rotate-45"><Plus size={16} aria-hidden /></span>
            </summary>
            <p className="font-body pb-5 pr-5 text-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
