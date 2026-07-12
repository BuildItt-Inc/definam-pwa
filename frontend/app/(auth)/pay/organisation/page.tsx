'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CreditCard,
  GraduationCap,
  Loader2,
  Mail,
  Users,
} from 'lucide-react';

import { initializeOrgPayment, PaymentError } from '@/lib/api/payment';
import { InfoCard } from '@/components/ui/InfoCard';

// ── Zod schema ─────────────────────────────────────────────────────────────

const orgPaymentSchema = z.object({
  school_email: z
    .string()
    .min(1, 'School email is required')
    .email('Please enter a valid email address'),
  school_name: z
    .string()
    .min(1, 'School name is required')
    .min(3, 'School name must be at least 3 characters')
    .max(100, 'School name cannot exceed 100 characters'),
  student_count: z
    .string()
    .min(1, 'Number of students is required')
    .refine(
      (val) => !isNaN(Number(val)) && val.trim() !== '',
      'Please enter a valid number',
    )
    .transform((val) => Number(val))
    .refine(Number.isInteger, 'Student count must be a whole number')
    .refine((val) => val >= 1, 'Must be at least 1 student')
    .refine((val) => val <= 10000, 'Cannot exceed 10,000 students'),
});

// Input type: what the form stores (student_count is still a raw string).
// Output type: what zod delivers to onSubmit after the .transform() runs.
type OrgPaymentFormValues = z.input<typeof orgPaymentSchema>;
type OrgPaymentSubmitValues = z.output<typeof orgPaymentSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────

const PRICE_PER_STUDENT = 1700;

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OrgPayPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrgPaymentFormValues, unknown, OrgPaymentSubmitValues>({
    resolver: zodResolver(orgPaymentSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  // Real-time price calculation — independent of submit validation
  const rawCountStr = watch('student_count') ?? '';
  const parsedCount = parseInt(rawCountStr, 10);
  const displayCount = !isNaN(parsedCount) && parsedCount > 0 ? parsedCount : 0;
  const total = displayCount * PRICE_PER_STUDENT;

  // Button enabled once school_email and student_count are plausibly filled
  const emailVal = watch('school_email') ?? '';
  const canSubmit =
    !isLoading &&
    emailVal.includes('@') &&
    !isNaN(parsedCount) &&
    parsedCount >= 1;

  async function onSubmit(values: OrgPaymentSubmitValues) {
    setBannerError(null);
    setIsLoading(true);
    try {
      const data = await initializeOrgPayment({
        school_email: values.school_email,
        school_name: values.school_name,
        student_count: values.student_count,
      });
      sessionStorage.setItem('payment_ref', data.reference);
      sessionStorage.setItem('org_email', values.school_email);
      sessionStorage.setItem('payment_type', 'organisation');
      sessionStorage.setItem('total_amount_naira', data.total_amount_naira.toString());
      window.location.href = data.authorization_url;
    } catch (err) {
      if (err instanceof PaymentError) {
        setBannerError('Could not initialise payment. Please try again.');
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
      setIsLoading(false);
    }
  }

  function fieldBorder(hasError: boolean) {
    return [
      'border rounded-xl transition-colors',
      hasError ? 'border-danger' : 'border-border-2 focus-within:border-ink',
    ].join(' ');
  }

  return (
    <div className="min-h-screen bg-bg-0 font-dm-sans">
      {/* App bar */}
      <header className="flex items-center gap-3 px-4 h-[56px] border-b border-border-2 bg-bg-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-ink hover:bg-ink/6 active:bg-ink/10 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="text-[15px] font-bold text-ink tracking-tight">
          Organisation Access
        </span>
      </header>

      <main className="px-5 pt-7 pb-12 md:max-w-md md:mx-auto md:pt-10">

        {/* Info card */}
        <InfoCard
          icon={Building2}
          iconStyle="pill"
          title="For Schools & Organisations"
          body="Pay for all your students at once. You get an admin dashboard + access codes to share."
          className="mb-5"
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── School email ── */}
          <div className="mb-4">
            <div className={fieldBorder(!!errors.school_email)}>
              <label
                htmlFor="school-email"
                className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-ink cursor-pointer"
              >
                <Mail size={11} strokeWidth={2.5} aria-hidden />
                School Email Address
              </label>
              <input
                id="school-email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                autoCapitalize="none"
                placeholder="admin@kingsschool.edu.ng"
                className="w-full px-3.5 pt-1.5 pb-3.5 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                {...register('school_email')}
              />
            </div>
            {errors.school_email && (
              <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-danger">
                {errors.school_email.message}
              </p>
            )}
          </div>

          {/* ── School name ── */}
          <div className="mb-4">
            <div className={fieldBorder(!!errors.school_name)}>
              <label
                htmlFor="school-name"
                className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-ink cursor-pointer"
              >
                <GraduationCap size={11} strokeWidth={2.5} aria-hidden />
                School Name
              </label>
              <input
                id="school-name"
                type="text"
                autoComplete="organization"
                spellCheck={false}
                placeholder="Kings Secondary School, Lagos"
                className="w-full px-3.5 pt-1.5 pb-3.5 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                {...register('school_name')}
              />
            </div>
            {errors.school_name && (
              <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-danger">
                {errors.school_name.message}
              </p>
            )}
          </div>

          {/* ── Number of students ── */}
          <div className="mb-4">
            <div className={fieldBorder(!!errors.student_count)}>
              <label
                htmlFor="student-count"
                className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-ink cursor-pointer"
              >
                <Users size={11} strokeWidth={2.5} aria-hidden />
                Number of Students
              </label>
              <input
                id="student-count"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="850"
                className="w-full px-3.5 pt-1.5 pb-3.5 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                {...register('student_count')}
              />
            </div>
            {errors.student_count && (
              <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-danger">
                {errors.student_count.message}
              </p>
            )}
          </div>

          {/* ── Price summary (client-side preview) ── */}
          <div className="bg-bg-2 border border-border-2 rounded-xl px-4 py-3.5 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-ink/75">
                {displayCount > 0
                  ? `${displayCount.toLocaleString('en-NG')} students × ${formatNaira(PRICE_PER_STUDENT)}/term`
                  : `— students × ${formatNaira(PRICE_PER_STUDENT)}/term`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-ink">Total</span>
              <span className="font-syne text-[18px] font-black text-ink tracking-tight">
                {formatNaira(total)}
              </span>
            </div>
          </div>

          {/* ── Error banner ── */}
          {bannerError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-danger-bg border border-danger/25 text-danger text-[13px] font-medium leading-snug mb-4"
            >
              <AlertCircle
                size={16}
                strokeWidth={2}
                className="flex-shrink-0 mt-0.5"
                aria-hidden
              />
              {bannerError}
            </div>
          )}

          {/* ── CTA button ── */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                Redirecting…
              </>
            ) : (
              <>
                <CreditCard size={18} strokeWidth={2.2} aria-hidden />
                Proceed to Payment
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
