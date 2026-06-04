'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Loader2,
  Mail,
  User,
} from 'lucide-react';

import {
  initializeIndividualPayment,
  PaymentError,
} from '@/lib/api/payment';

export default function IndividualPayPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  async function handleProceedToPayment() {
    setBannerError(null);
    setIsLoading(true);
    try {
      const data = await initializeIndividualPayment();
      sessionStorage.setItem('payment_ref', data.reference);
      sessionStorage.setItem('payment_type', 'individual');
      window.location.href = data.payment_url;
    } catch (err) {
      if (err instanceof PaymentError) {
        setBannerError('Could not initialise payment. Please try again.');
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream font-dm-sans">
      {/* App bar */}
      <header className="flex items-center gap-3 px-4 h-[56px] border-b border-black/8 bg-cream">
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
        <div className="flex items-start gap-3 bg-[#EAF3DE] border border-[#9FE1CB] rounded-xl p-4 mb-4">
          <div className="w-9 h-9 bg-jade rounded-xl flex items-center justify-center flex-shrink-0">
            <User size={17} strokeWidth={2} className="text-white" aria-hidden />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#085041] leading-none mb-1">
              Personal Subscription
            </p>
            <p className="text-[12px] text-[#0F6E56] leading-snug">
              Full access to all subjects · ₦1,700 per term · No school required
            </p>
          </div>
        </div>

        {/* Price card */}
        <div className="bg-ink rounded-xl px-5 py-7 text-center mb-5">
          <p className="text-[11px] font-medium text-white/40 mb-2 uppercase tracking-wide">
            Amount to pay
          </p>
          <p className="font-syne text-[42px] font-black text-white tracking-tight leading-none">
            ₦1,700
          </p>
          <p className="text-[11px] text-white/30 mt-2.5">
            Per term · One-time access code
          </p>
        </div>

        {/* Error banner */}
        {bannerError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-coral/10 border border-coral/25 text-coral text-[13px] font-medium leading-snug mb-4"
          >
            <AlertCircle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" aria-hidden />
            {bannerError}
          </div>
        )}

        {/* CTA button */}
        <button
          type="button"
          onClick={handleProceedToPayment}
          disabled={isLoading}
          className="w-full min-h-[52px] bg-jade text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-jade/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-sm mb-4"
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

        {/* Email note */}
        <div className="flex items-center justify-center gap-1.5">
          <Mail size={13} strokeWidth={2} className="text-jade flex-shrink-0" aria-hidden />
          <p className="text-[12px] text-ink/40">
            You&apos;ll receive an access code by email after payment
          </p>
        </div>

      </main>
    </div>
  );
}
