import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Recall',
  description: 'How Recall collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-[13px] font-semibold text-brand hover:text-brand-dark">
        &larr; Back to Recall
      </Link>

      <h1 className="mb-2 mt-6 text-[26px] font-extrabold tracking-[-0.02em] text-ink">
        Privacy Policy
      </h1>
      <p className="mb-8 text-[13px] text-faint">Last updated: 7 August 2026</p>

      {/* PLACEHOLDER — this is boilerplate structure, not reviewed legal
          copy. Replace every section below with an actual privacy policy
          drafted or reviewed by qualified legal counsel before relying on
          this page for a paid product handling student data. */}
      <div className="rounded-xl border border-warn/30 bg-warn-bg px-4 py-3 text-[13px] text-ink">
        This page is a placeholder. The sections below are structural only and have not been
        reviewed by legal counsel — replace this content before treating it as binding.
      </div>

      <div className="mt-8 flex flex-col gap-6 text-[14px] leading-[1.7] text-ink">
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">1. Information we collect</h2>
          <p className="text-muted">
            Account details (name, email or phone, school if applicable) and study activity
            (progress, answers, streaks) needed to run the service. Placeholder text — replace
            with an actual accounting of data collected.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">2. How we use your information</h2>
          <p className="text-muted">
            To run your account, track your study progress, and improve the product. Placeholder
            text — replace with actual use-of-data terms.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">3. Data sharing</h2>
          <p className="text-muted">
            Schools with bulk access can see progress for their own enrolled students.
            Placeholder text — replace with actual data-sharing terms.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">4. Data retention</h2>
          <p className="text-muted">
            Placeholder text — replace with actual retention periods and deletion process.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">5. Your rights</h2>
          <p className="text-muted">
            Placeholder text — replace with actual rights (access, correction, deletion) and how
            to exercise them.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">6. Contact</h2>
          <p className="text-muted">
            Questions about this policy can be sent to{' '}
            <a href="mailto:support@definam.ng" className="text-brand hover:text-brand-dark">
              support@definam.ng
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
