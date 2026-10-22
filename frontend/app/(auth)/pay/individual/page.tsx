'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  Lock,
} from 'lucide-react';

import { initializeIndividualPayment, PaymentError } from '@/lib/api/payment';

const individualPaySchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type IndividualPayFormValues = z.infer<typeof individualPaySchema>;

function IndividualPayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTermsParam = searchParams.get('terms');
  const [selectedTerms, setSelectedTerms] = useState<number>(
    initialTermsParam === '3' ? 3 : 1
  );
  const [isLoading, setIsLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IndividualPayFormValues>({
    resolver: zodResolver(individualPaySchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  async function onSubmit(values: IndividualPayFormValues) {
    setBannerError(null);
    setIsLoading(true);
    try {
      const data = await initializeIndividualPayment(values.email, selectedTerms);
      sessionStorage.setItem('payment_ref', data.reference);
      sessionStorage.setItem('payment_type', 'individual');
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

  const isThreeTerms = selectedTerms === 3;
  const priceDisplay = isThreeTerms ? '₦5,100' : '₦2,000';

  return (
    <div className="min-h-screen bg-bg-0 text-ink">
      {/* ── App bar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-[56px] border-b border-border-2 bg-bg-0 max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          aria-label="Go back"
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-lg text-ink hover:bg-ink/5 active:bg-ink/10 transition-colors"
        >
          <ArrowLeft size={19} strokeWidth={2.2} />
        </button>
        <span className="text-[17px] font-bold text-ink tracking-tight">
          Get access
        </span>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="px-5 pt-6 pb-12 max-w-md mx-auto w-full">
        <h1 className="text-[28px] font-extrabold text-ink tracking-tight leading-tight mb-1.5">
          Choose your plan
        </h1>
        <p className="text-[14px] text-muted mb-6 leading-snug">
          Pay once. No auto-renew, no surprise charges.
        </p>

        {/* ── Plan options ─────────────────────────────────────────────────── */}
        <div className="space-y-3 mb-6" role="radiogroup" aria-label="Subscription plan">
          {/* 1 Term */}
          <div
            onClick={() => setSelectedTerms(1)}
            role="radio"
            aria-checked={selectedTerms === 1}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') setSelectedTerms(1);
            }}
            className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedTerms === 1
                ? 'border-brand bg-white shadow-xs ring-1 ring-brand/20'
                : 'border-border-2 bg-white hover:border-border'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedTerms === 1
                    ? 'bg-brand text-white'
                    : 'border-2 border-border-2'
                }`}
              >
                {selectedTerms === 1 && <Check size={12} strokeWidth={3} />}
              </div>
              <div>
                <span className="block text-[16px] font-bold text-ink leading-tight">
                  1 term
                </span>
                <span className="block text-[13px] text-muted mt-0.5">
                  120 days of full access
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="block text-[20px] font-black text-ink leading-tight">
                ₦2,000
              </span>
              <span className="block text-[11px] text-muted mt-0.5">
                about ₦17 a day
              </span>
            </div>
          </div>

          {/* 3 Terms */}
          <div
            onClick={() => setSelectedTerms(3)}
            role="radio"
            aria-checked={selectedTerms === 3}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') setSelectedTerms(3);
            }}
            className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedTerms === 3
                ? 'border-brand bg-white shadow-xs ring-1 ring-brand/20'
                : 'border-border-2 bg-white hover:border-border'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedTerms === 3
                    ? 'bg-brand text-white'
                    : 'border-2 border-border-2'
                }`}
              >
                {selectedTerms === 3 && <Check size={12} strokeWidth={3} />}
              </div>
              <div>
                <span className="block text-[16px] font-bold text-ink leading-tight">
                  3 terms
                </span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold tracking-tight">
                  Best value · Save ₦900
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="block text-[20px] font-black text-ink leading-tight">
                ₦5,100
              </span>
              <span className="block text-[11px] text-muted mt-0.5">
                ₦1,700 a term
              </span>
            </div>
          </div>
        </div>

        {/* ── Included features ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-[13px] font-bold text-ink mb-3">Included</p>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2.5 text-[14px] text-ink font-medium">
              <Check size={16} strokeWidth={2.5} className="text-brand flex-shrink-0" />
              All 22 subjects, SS1 to SS3
            </li>
            <li className="flex items-center gap-2.5 text-[14px] text-ink font-medium">
              <Check size={16} strokeWidth={2.5} className="text-brand flex-shrink-0" />
              Zikora, your AI tutor
            </li>
            <li className="flex items-center gap-2.5 text-[14px] text-ink font-medium">
              <Check size={16} strokeWidth={2.5} className="text-brand flex-shrink-0" />
              Daily review reminders (Day 1, 3, 7)
            </li>
            <li className="flex items-center gap-2.5 text-[14px] text-ink font-medium">
              <Check size={16} strokeWidth={2.5} className="text-brand flex-shrink-0" />
              One phone per access code
            </li>
          </ul>
        </div>

        {/* ── Payment form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-5">
            <label htmlFor="email" className="block text-[13px] font-bold text-ink mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              autoCapitalize="none"
              placeholder="you@example.com"
              className={`w-full h-[48px] rounded-xl border bg-white px-3.5 text-[16px] sm:text-[14px] text-ink placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all ${
                errors.email ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border-2'
              }`}
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-xs text-danger mt-1.5 font-medium">{errors.email.message}</p>
            ) : (
              <p className="text-[12px] text-muted mt-1.5 leading-snug">
                Your access code is sent here. If you don&apos;t see it, check spam.
              </p>
            )}
          </div>

          {bannerError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-danger-bg border border-danger/25 text-danger text-[13px] font-medium leading-snug mb-5"
            >
              <AlertCircle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" aria-hidden />
              {bannerError}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border-2 my-5" />

          {/* Total row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[15px] font-semibold text-muted">Total</span>
            <span className="text-[22px] font-black text-ink tracking-tight">
              {priceDisplay}
            </span>
          </div>

          {/* CTA button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[50px] rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mb-3.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                Initialising payment…
              </>
            ) : (
              <>
                <Lock size={16} strokeWidth={2.4} aria-hidden />
                Pay {priceDisplay} securely
              </>
            )}
          </button>

          {/* Payment method pills */}
          <div className="flex items-center justify-center gap-2 mb-3.5">
            <span className="px-3 py-1 rounded-lg border border-border-2 bg-white text-[11px] font-medium text-muted">
              Card
            </span>
            <span className="px-3 py-1 rounded-lg border border-border-2 bg-white text-[11px] font-medium text-muted">
              Bank transfer
            </span>
            <span className="px-3 py-1 rounded-lg border border-border-2 bg-white text-[11px] font-medium text-muted">
              USSD
            </span>
          </div>

          <p className="text-center text-[11px] text-muted leading-relaxed mb-6 max-w-xs mx-auto">
            Access starts when you activate your code, not when you pay.
          </p>

          <div className="text-center text-[13px] text-muted pt-2 pb-6">
            Already have a code?{' '}
            <Link
              href="/register"
              className="font-bold text-brand hover:underline underline-offset-2"
            >
              Create your account
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function IndividualPayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-0 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-ink" />
        </div>
      }
    >
      <IndividualPayContent />
    </Suspense>
  );
}
