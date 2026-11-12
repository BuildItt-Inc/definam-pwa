import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Recall',
  description: 'Terms and conditions for using the Recall learning platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-0 text-ink">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center text-[13px] font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          &larr; Back to Recall
        </Link>

        <h1 className="mb-2 mt-6 text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[32px]">
          Terms of Service
        </h1>
        <p className="mb-8 text-[13.5px] text-muted">
          Effective Date: 24 October 2026 · Version 1.0
        </p>

        <div className="flex flex-col gap-8 text-[14.5px] leading-[1.7] text-ink/90">
          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">1. Acceptance of Terms</h2>
            <p className="text-muted leading-relaxed">
              Welcome to Recall (&quot;the Service&quot;), operated by Definam Technologies (&quot;Definam&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
              By creating an account, redeeming an access code, subscribing, or accessing the application, you (&quot;User&quot; or &quot;Student&quot;)
              agree to be bound by these Terms of Service. If you are under 18 years of age, you confirm that you have obtained the consent of a parent,
              legal guardian, or authorized school administrator to use Recall.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">2. Description of the Service</h2>
            <p className="text-muted leading-relaxed">
              Recall is an educational study platform designed for West African secondary school students (SS1–SS3) preparing for WAEC, NECO, JAMB/UTME,
              and internal examinations. The platform provides curriculum summaries, structured step-by-step topics, spaced repetition recall reviews,
              curated practice questions, and an interactive AI study tutor.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">3. Access &amp; Account Models</h2>
            <div className="space-y-3 text-muted leading-relaxed">
              <p>
                <strong>Individual Accounts:</strong> Students or parents purchase an individual access code or subscription for a term or academic period.
                Individual accounts are for personal, non-transferable study.
              </p>
              <p>
                <strong>School / Institutional Access:</strong> When a school or institution purchases bulk access, it distributes access codes to enrolled students.
                School administrators may view aggregated and individual academic progress, completion rates, and recall performance for enrolled students.
              </p>
              <p>
                <strong>Single-Session Security:</strong> To prevent unauthorized credential sharing, each student account may only maintain one active session
                at a time. Logging in on a new device will sign out any previously active session.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">4. Payments, Subscriptions, and Access Codes</h2>
            <p className="text-muted leading-relaxed">
              Access to curriculum content is granted via prepaid terms or school licenses processed through authorized payment partners (including Paystack).
              Access codes grant full platform access for the specified duration. Unless explicitly stated otherwise during checkout, individual terms do not
              auto-renew without your confirmation. All fees paid are non-refundable once an access code has been activated and curriculum lessons accessed,
              except as required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">5. Acceptable Use and Academic Integrity</h2>
            <p className="text-muted leading-relaxed">
              You agree to use Recall solely for legitimate educational preparation. You agree not to:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-muted">
              <li>Attempt to scrape, reverse engineer, or bulk download learning content, question banks, or source code.</li>
              <li>Share, sell, or rent your account credentials or school-issued access codes to unauthorized third parties.</li>
              <li>Abuse, spam, or submit harmful, offensive, or inappropriate queries to the AI tutor.</li>
              <li>Interfere with the platform&apos;s security, server infrastructure, or rate-limiting mechanisms.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">6. AI Tutor Guidance &amp; Educational Disclaimer</h2>
            <p className="text-muted leading-relaxed">
              Our AI study tutor (&quot;Zikora&quot;) provides explanations, analogies, and step-by-step breakdowns based on national secondary school curricula.
              While we continuously tune our educational models for high fidelity, AI-generated explanations are supplementary study aids and should be cross-referenced
              with official WAEC/NECO/JAMB syllabi and approved textbooks. Recall does not guarantee specific examination scores.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">7. Intellectual Property</h2>
            <p className="text-muted leading-relaxed">
              All curriculum summaries, question explanations, diagrams, software code, visual design, and trademarks associated with Recall are the proprietary
              intellectual property of Definam Technologies. You are granted a limited, personal, revocable license to access and read materials during your active term.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">8. Termination</h2>
            <p className="text-muted leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in credential sharing, or attempt to exploit the platform.
              You may stop using Recall at any time.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">9. Governing Law &amp; Dispute Resolution</h2>
            <p className="text-muted leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising in connection with
              these Terms shall be resolved primarily through amicable mutual negotiation, and where unresolved, submitted to the competent courts of Nigeria.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="mb-1.5 text-[15px] font-bold text-ink">10. Contact Us</h2>
            <p className="text-muted">
              If you have any questions or feedback regarding these Terms, please reach out to us at{' '}
              <a href="mailto:support@definam.ng" className="font-semibold text-brand underline underline-offset-2">
                support@definam.ng
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
