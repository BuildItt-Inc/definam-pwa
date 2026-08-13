'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Loader2,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';

import { initializeIndividualPayment, PaymentError } from '@/lib/api/payment';
import { InfoCard } from '@/components/ui/InfoCard';

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
  const termLabel = isThreeTerms ? '3 terms' : '1 term';
  const durationDesc = isThreeTerms
    ? 'Full access for 3 terms (12 months) · Save 15%'
    : 'Full access for 1 term (4 months)';

  return (
    <div className="min-h-screen bg-bg-0">
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
          Individual Access
        </span>
      </header>

      <main className="px-5 pt-7 pb-12 md:max-w-md md:mx-auto md:pt-10">

        {/* Info card */}
        <InfoCard
          icon={User}
          iconStyle="pill"
          title="Personal Subscription"
          body="Full access to all subjects & AI tutor · No school required"
          className="mb-4"
        />

        {/* Term selector toggle */}
        <div className="grid grid-cols-2 gap-2.5 p-1 bg-bg-2 border border-border-2 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setSelectedTerms(1)}
            className={[
              'flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all duration-150 cursor-pointer',
              !isThreeTerms
                ? 'bg-ink text-white font-bold shadow-xs'
                : 'text-ink/60 hover:text-ink font-medium',
            ].join(' ')}
          >
            <span className="text-[13px]">Single Term</span>
            <span className={['text-[11px]', !isThreeTerms ? 'text-white/70' : 'text-ink/40'].join(' ')}>
              ₦2,000 / term
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTerms(3)}
            className={[
              'relative flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all duration-150 cursor-pointer',
              isThreeTerms
                ? 'bg-ink text-white font-bold shadow-xs'
                : 'text-ink/60 hover:text-ink font-medium',
            ].join(' ')}
          >
            <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-jade text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-xs flex items-center gap-0.5">
              <Sparkles size={10} strokeWidth={2.5} /> Save 15%
            </span>
            <span className="text-[13px]">3 Terms</span>
            <span className={['text-[11px]', isThreeTerms ? 'text-white/70' : 'text-ink/40'].join(' ')}>
              ₦5,100 / 3 terms
            </span>
          </button>
        </div>

        {/* Price card */}
        <div className="bg-ink rounded-xl px-5 py-7 text-center mb-5">
          <p className="text-[11px] font-medium text-white/40 mb-2 uppercase tracking-wide">
            Amount to pay ({termLabel})
          </p>
          <p className="font-bold text-[42px] font-black text-white tracking-tight leading-none">
            {priceDisplay}
          </p>
          <p className="text-[11px] text-white/40 mt-2.5">
            {durationDesc}
          </p>
          {isThreeTerms && (
            <p className="text-[11px] text-jade font-semibold mt-1">
              ₦6,000 value · You save ₦900
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── Email ── */}
          <div className="mb-5">
            <div
              className={[
                'border rounded-xl transition-colors',
                errors.email
                  ? 'border-danger'
                  : 'border-border-2 focus-within:border-ink',
              ].join(' ')}
            >
              <label
                htmlFor="email"
                className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-ink cursor-pointer"
              >
                <Mail size={11} strokeWidth={2.5} aria-hidden />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                autoCapitalize="none"
                placeholder="you@example.com"
                className="w-full px-3.5 pt-1.5 pb-3.5 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-danger">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Error banner */}
          {bannerError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-danger-bg border border-danger/25 text-danger text-[13px] font-medium leading-snug mb-4"
            >
              <AlertCircle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" aria-hidden />
              {bannerError}
            </div>
          )}

          {/* CTA button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-sm mb-4 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                Redirecting…
              </>
            ) : (
              <>
                <CreditCard size={18} strokeWidth={2.2} aria-hidden />
                Proceed to Payment ({priceDisplay})
              </>
            )}
          </button>

          {/* Email note */}
          <div className="flex items-center justify-center gap-1.5">
            <Mail size={13} strokeWidth={2} className="text-ink flex-shrink-0" aria-hidden />
            <p className="text-[12px] text-ink/40">
              Your access code will be sent to this email after payment
            </p>
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
