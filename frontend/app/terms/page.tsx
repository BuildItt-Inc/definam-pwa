import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Recall',
  description: 'Terms and conditions for using Recall.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-[13px] font-semibold text-brand hover:text-brand-dark">
        &larr; Back to Recall
      </Link>

      <h1 className="mb-2 mt-6 text-[26px] font-extrabold tracking-[-0.02em] text-ink">
        Terms &amp; Conditions
      </h1>
      <p className="mb-8 text-[13px] text-faint">Last updated: 7 August 2026</p>

      {/* PLACEHOLDER — this is boilerplate structure, not reviewed legal
          copy. Replace every section below with actual terms drafted or
          reviewed by qualified legal counsel before relying on this page
          for a paid product. */}
      <div className="rounded-xl border border-warn/30 bg-warn-bg px-4 py-3 text-[13px] text-ink">
        This page is a placeholder. The sections below are structural only and have not been
        reviewed by legal counsel — replace this content before treating it as binding.
      </div>

      <div className="mt-8 flex flex-col gap-6 text-[14px] leading-[1.7] text-ink">
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">1. Acceptance of terms</h2>
          <p className="text-muted">
            By creating an account or paying for access to Recall, you agree to these terms.
            Placeholder text — replace with actual acceptance language.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">2. Use of the service</h2>
          <p className="text-muted">
            Recall is provided for personal study use by secondary school students, or by
            schools purchasing bulk access for their students. Placeholder text — replace with
            actual usage terms.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">3. Payment and renewal</h2>
          <p className="text-muted">
            Individual access is billed per term and does not renew automatically unless stated
            otherwise at checkout. Placeholder text — replace with actual billing terms.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">4. Account responsibility</h2>
          <p className="text-muted">
            You are responsible for keeping your login credentials secure. Placeholder text —
            replace with actual account-responsibility terms.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">5. Changes to these terms</h2>
          <p className="text-muted">
            Recall may update these terms from time to time. Placeholder text — replace with
            actual change-notification terms.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 text-[15px] font-bold text-ink">6. Contact</h2>
          <p className="text-muted">
            Questions about these terms can be sent to{' '}
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
