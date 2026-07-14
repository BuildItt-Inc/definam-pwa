// Register http://localhost:3000/pay/callback in your Paystack dashboard
// under Settings → API Keys & Webhooks

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  CircleCheck,
  Loader2,
  Mail,
} from 'lucide-react';

import { verifyPayment } from '@/lib/api/payment';
import type { VerifyOrgPaymentResponse } from '@/types/payment';
import { InfoCard } from '@/components/ui/InfoCard';

// ── State type ─────────────────────────────────────────────────────────────

type VerifyState =
  | { status: 'loading' }
  | { status: 'success'; paymentType: 'individual'; email: string }
  | {
      status: 'success';
      paymentType: 'organisation';
      adminEmail: string;
      orgName: string;
      totalAmountNaira: number;
    }
  | { status: 'error' };

// ── Inner component (needs Suspense boundary because of useSearchParams) ───

function CallbackContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>({ status: 'loading' });

  useEffect(() => {
    const reference = searchParams.get('reference');

    if (!reference) {
      setState({ status: 'error' });
      return;
    }

    // Read payment_type set by the initiating page before the Paystack redirect.
    // Default to 'individual' so the existing individual flow is never broken.
    const paymentType = sessionStorage.getItem('payment_type') ?? 'individual';

    let cancelled = false;

    verifyPayment(reference)
      .then((data) => {
        if (cancelled) return;

        if (!data.verified) {
          setState({ status: 'error' });
          return;
        }

        if (paymentType === 'organisation') {
          const orgData = data as unknown as VerifyOrgPaymentResponse;
          const storedTotal = sessionStorage.getItem('total_amount_naira');
          const totalAmountNaira = parseInt(storedTotal ?? '0', 10) || 0;
          setState({
            status: 'success',
            paymentType: 'organisation',
            adminEmail:
              orgData.admin_email ||
              sessionStorage.getItem('org_email') ||
              '',
            orgName: orgData.org_name || '',
            totalAmountNaira,
          });
        } else {
          if (data.email) {
            setState({
              status: 'success',
              paymentType: 'individual',
              email: data.email,
            });
          } else {
            setState({ status: 'error' });
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
        <Loader2
          size={32}
          strokeWidth={2}
          className="text-ink animate-spin"
          aria-hidden
        />
        <p className="text-[14px] font-medium text-ink/50">
          Verifying payment…
        </p>
      </div>
    );
  }

  // ── Individual success ───────────────────────────────────────────────────
  if (state.status === 'success' && state.paymentType === 'individual') {
    return (
      <div className="flex flex-col items-center text-center pt-4 pb-2">
        <div className="w-[60px] h-[60px] bg-ink rounded-full flex items-center justify-center mb-5">
          <CircleCheck size={30} strokeWidth={2} className="text-white" aria-hidden />
        </div>

        <h1 className="font-bold text-[26px] font-black text-ink tracking-tight leading-none mb-2">
          Payment Successful
        </h1>
        <p className="text-[13px] text-ink/50 mb-1.5">
          Your access code has been sent to
        </p>
        <p className="text-[13px] font-bold text-ink mb-8 break-all">
          {state.email}
        </p>

        {/* What's next */}
        <InfoCard className="px-4 py-4 mb-7 w-full text-left">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink mb-3">
            Next steps
          </p>
          <ol className="space-y-2">
            <li className="flex items-start gap-2 text-[12px] text-ink/75 leading-snug">
              <span className="w-4 h-4 bg-ink text-white rounded-[4px] text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              Check your email for the access code
            </li>
            <li className="flex items-start gap-2 text-[12px] text-ink/75 leading-snug">
              <span className="w-4 h-4 bg-ink text-white rounded-[4px] text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              Create your account using the code
            </li>
            <li className="flex items-start gap-2 text-[12px] text-ink/75 leading-snug">
              <span className="w-4 h-4 bg-ink text-white rounded-[4px] text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              Log in with your username and password from then on
            </li>
          </ol>
        </InfoCard>

        <Link
          href="/register"
          className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 active:scale-[0.985] transition-all duration-150 shadow-sm"
        >
          <CircleCheck size={18} strokeWidth={2.2} aria-hidden />
          Create your account
        </Link>
      </div>
    );
  }

  // ── Organisation success ─────────────────────────────────────────────────
  if (state.status === 'success' && state.paymentType === 'organisation') {
    return (
      <div className="flex flex-col items-center text-center pt-4 pb-2">
        <div className="w-[60px] h-[60px] bg-ink rounded-full flex items-center justify-center mb-5">
          <CircleCheck size={30} strokeWidth={2} className="text-white" aria-hidden />
        </div>

        <h1 className="font-bold text-[26px] font-black text-ink tracking-tight leading-none mb-2">
          Payment Successful
        </h1>
        {state.orgName && (
          <p className="text-[13px] font-bold text-ink mb-1">{state.orgName}</p>
        )}
        <p className="text-[13px] text-ink/50 mb-8 leading-snug max-w-[300px]">
          Your admin login details and access codes have been sent to your email.
        </p>

        {/* Confirmation card */}
        <InfoCard className="px-4 py-4 mb-7 w-full">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 size={15} strokeWidth={2} className="text-white" aria-hidden />
            </div>
            <div className="text-left">
              <p className="text-[12px] font-bold text-ink mb-0.5">
                Check your email
              </p>
              <p className="text-[12px] text-ink/75 leading-snug break-all">
                {state.adminEmail}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border-2 space-y-1.5">
            {[
              'Admin login link + temporary password',
              'CSV file with all student access codes',
              'Payment receipt',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[12px] text-ink/75">
                <Mail size={12} strokeWidth={2} className="text-ink flex-shrink-0" aria-hidden />
                {item}
              </div>
            ))}
          </div>

          {state.totalAmountNaira > 0 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-2">
              <span className="text-[12px] font-medium text-ink">Total paid</span>
              <span className="font-bold text-[14px] font-black text-ink tracking-tight">
                ₦{state.totalAmountNaira.toLocaleString('en-NG')}
              </span>
            </div>
          )}
        </InfoCard>

        <p className="text-[12px] text-ink/40 leading-snug max-w-[280px]">
          Share the access codes with your students. They log in using their
          unique code — no registration needed.
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center text-center pt-4 pb-2">
      <div className="w-[60px] h-[60px] bg-danger-bg border border-danger/25 rounded-full flex items-center justify-center mb-5">
        <AlertCircle size={28} strokeWidth={2} className="text-danger" aria-hidden />
      </div>

      <h1 className="font-bold text-[24px] font-black text-ink tracking-tight leading-none mb-2">
        Verification Failed
      </h1>
      <p className="text-[13px] text-ink/50 leading-snug mb-8 max-w-[280px]">
        Payment could not be verified. Please contact support.
      </p>

      <Link
        href="/pay/individual"
        className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 active:scale-[0.985] transition-all duration-150 shadow-sm mb-4"
      >
        Try again
      </Link>

      <p className="text-[12px] text-ink/40">
        Need help?{' '}
        <a
          href="mailto:support@definam.ng"
          className="text-ink font-bold hover:text-ink/75 transition-colors"
        >
          Contact support
        </a>
      </p>
    </div>
  );
}

// ── Fallback shown while CallbackContent hydrates ─────────────────────────

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
      <Loader2
        size={32}
        strokeWidth={2}
        className="text-ink animate-spin"
        aria-hidden
      />
      <p className="text-[14px] font-medium text-ink/50">
        Verifying payment…
      </p>
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────

export default function CallbackPage() {
  return (
    <div className="min-h-screen bg-bg-0">
      {/* App bar */}
      <header className="flex items-center px-4 h-[56px] border-b border-border-2 bg-bg-0">
        <span className="text-[15px] font-bold text-ink tracking-tight">
          Payment
        </span>
      </header>

      <main className="px-5 pt-8 pb-12 md:max-w-md md:mx-auto md:pt-12">
        <Suspense fallback={<LoadingFallback />}>
          <CallbackContent />
        </Suspense>
      </main>
    </div>
  );
}
