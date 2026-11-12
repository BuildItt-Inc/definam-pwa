import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Recall',
  description: 'How Recall collects, protects, and handles student study information.',
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-8 text-[13.5px] text-muted">
          Effective Date: 24 October 2026 · Version 1.0
        </p>

        <div className="flex flex-col gap-8 text-[14.5px] leading-[1.7] text-ink/90">
          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">1. Our Commitment to Student Privacy</h2>
            <p className="text-muted leading-relaxed">
              Definam Technologies (&quot;Recall&quot;, &quot;we&quot;, &quot;us&quot;) is committed to safeguarding the privacy and personal data of our learners.
              This Privacy Policy explains what information we collect when students, parents, and schools use our Progressive Web Application,
              how that information is used to power spaced-repetition learning, and the choices available to you under the Nigeria Data Protection Act (NDPA 2023)
              and applicable student data protection standards.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">2. Information We Collect</h2>
            <div className="space-y-3 text-muted leading-relaxed">
              <p>
                <strong>Account &amp; Profile Details:</strong> Student name or chosen username, class level (SS1, SS2, or SS3), target examinations (WAEC, NECO, JAMB),
                selected subjects, and, where applicable, affiliated school name. For individual paid accounts, an email address or phone number is collected for access codes and account recovery.
              </p>
              <p>
                <strong>Learning &amp; Review Activity:</strong> Completed topics, practice question scores, confidence self-ratings (Again, Hard, Good, Easy),
                spaced repetition review queues, study streaks, and interaction timestamps. This data is the core input used by our spaced-repetition engine to schedule revision.
              </p>
              <p>
                <strong>AI Study Tutor Conversations:</strong> Academic questions and prompts submitted to the AI tutor (&quot;Zikora&quot;) to generate explanations,
                summaries, and follow-up guidance.
              </p>
              <p>
                <strong>Device &amp; Notification Data:</strong> Device operating system (Android, iOS, Desktop), browser type, and push notification tokens
                (via Firebase Cloud Messaging) strictly to deliver scheduled study reminders when enabled by the student.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">3. How We Use Your Information</h2>
            <p className="text-muted leading-relaxed">We process collected data exclusively to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-muted">
              <li>Calculate optimal spaced-repetition review schedules (Day 1, Day 3, Day 7 intervals).</li>
              <li>Provide personalized AI tutor explanations and follow-up questions tailored to your active curriculum subjects.</li>
              <li>Track and display personal study streaks, mastery percentages, and topic completion rings.</li>
              <li>Send opted-in review alerts and streak-protection push notifications.</li>
              <li>Provide school teachers and administrators with academic analytics (completion rates, subject mastery) for enrolled students.</li>
              <li>Maintain platform security, prevent unauthorized account sharing, and troubleshoot technical errors.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">4. No Sale of Student Data &amp; Advertising</h2>
            <p className="text-muted leading-relaxed">
              <strong>We do not sell student data.</strong> We do not serve third-party behavioral advertisements or monetize student profiles.
              All data collected is used solely to facilitate educational delivery and student academic improvement.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">5. Service Providers &amp; Data Sharing</h2>
            <p className="text-muted leading-relaxed">
              We share data with trusted infrastructure providers under strict confidentiality agreements:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-muted">
              <li><strong>Payment Processing:</strong> Paystack securely handles subscription payments; Recall does not store credit card or bank credentials.</li>
              <li><strong>Push Notifications:</strong> Google Firebase Cloud Messaging processes encrypted device tokens to dispatch review reminders.</li>
              <li><strong>AI Infrastructure:</strong> Secure cloud LLM providers process academic study queries to generate tutor replies; queries are not used to train public foundation models.</li>
              <li><strong>School Administrators:</strong> Authorized school representatives can view progress metrics for students registered under their school license.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">6. Data Security &amp; Single-Session Protection</h2>
            <p className="text-muted leading-relaxed">
              We employ HTTPS encryption in transit, secure database authentication, and single-session access tokens. When a student signs in on a new device,
              the prior session is automatically invalidated to safeguard student records and prevent unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[17px] font-bold text-ink">7. Your Rights &amp; Data Deletion</h2>
            <p className="text-muted leading-relaxed">
              Under applicable privacy regulations, students and parents have the right to request access to their stored personal data, request correction of inaccurate records,
              or request complete deletion of their account and study history. To exercise any of these rights, contact our privacy team at{' '}
              <a href="mailto:privacy@definam.ng" className="font-semibold text-brand underline underline-offset-2">
                privacy@definam.ng
              </a>.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="mb-1.5 text-[15px] font-bold text-ink">8. Contact Us</h2>
            <p className="text-muted">
              For any privacy concerns, data inquiries, or parental requests, please contact:{' '}
              <a href="mailto:privacy@definam.ng" className="font-semibold text-brand underline underline-offset-2">
                privacy@definam.ng
              </a>{' '}
              or write to Definam Technologies, Lagos, Nigeria.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
