// Register http://localhost:3000/pay/callback in your Paystack dashboard
// under Settings → API Keys & Webhooks

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  ClipboardCheck,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { verifyPayment } from '@/lib/api/payment';
import type { VerifyOrgPaymentResponse } from '@/types/payment';
import { InfoCard } from '@/components/ui/InfoCard';
import { useCelebration } from '@/components/ui/celebration/CelebrationContext';
import { toast } from '@/lib/toast';
import { staggerContainer, staggerItem, scaleTap, standardEasing } from '@/lib/motion';

// ── State type ─────────────────────────────────────────────────────────────

type VerifyState =
  | { status: 'loading' }
  | { status: 'success'; paymentType: 'individual'; email: string; accessCode: string }
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
  const router = useRouter();
  const { celebrate } = useCelebration();
  const [state, setState] = useState<VerifyState>({ status: 'loading' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const reference = searchParams.get('reference');

    if (!reference) {
      setState({ status: 'error' });
      return;
    }

    const paymentType = sessionStorage.getItem('payment_type') ?? 'individual';
    let cancelled = false;

    verifyPayment(reference)
      .then((data) => {
        if (cancelled) return;

        if (data.status !== 'success') {
          setState({ status: 'error' });
          toast.error('Payment could not be verified');
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
          if (data.email && data.access_code) {
            setState({
              status: 'success',
              paymentType: 'individual',
              email: data.email,
              accessCode: data.access_code,
            });
            celebrate({
              type: 'payment',
              email: data.email,
              accessCode: data.access_code,
              onRedirect: () =>
                router.push(`/register?code=${encodeURIComponent(data.access_code!)}`),
            });
          } else {
            setState({ status: 'error' });
            toast.error('Payment verified, but no access code was found', 'Contact support.');
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'error' });
        toast.error('Payment could not be verified');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Access code copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-border-2" />
          <Loader2
            size={40}
            strokeWidth={1.5}
            className="text-ink animate-spin absolute inset-0 m-auto"
            aria-hidden
          />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-ink">Verifying payment…</p>
          <p className="text-[12px] text-muted mt-1">This only takes a moment</p>
        </div>
      </div>
    );
  }

  // ── Individual success ───────────────────────────────────────────────────
  if (state.status === 'success' && state.paymentType === 'individual') {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center"
      >
        {/* Success badge */}
        <motion.div variants={staggerItem} className="mb-5">
          <div className="relative inline-flex">
            <div className="w-[72px] h-[72px] rounded-full bg-success-bg flex items-center justify-center">
              <CheckCircle2 size={36} strokeWidth={1.75} className="text-success" aria-hidden />
            </div>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping bg-success-bg opacity-60" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={staggerItem} className="mb-5">
          <h1 className="font-black text-[28px] text-ink tracking-tight leading-none mb-2">
            Thank You!
          </h1>
          <p className="text-[13px] text-muted leading-snug max-w-[280px] mx-auto">
            Payment confirmed. Your access code has been generated and emailed to:
          </p>
          <p className="mt-2 text-[13px] font-bold text-ink break-all bg-bg-2 border border-border px-3 py-1.5 rounded-xl inline-block max-w-full">
            {state.email}
          </p>
        </motion.div>

        {/* Access Code Card */}
        <motion.div variants={staggerItem} className="w-full mb-5">
          <div className="w-full bg-ink rounded-2xl overflow-hidden shadow-sm">
            {/* Header strip */}
            <div className="px-5 pt-4 pb-3 border-b border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Your Access Code
              </p>
            </div>
            {/* Code display */}
            <div className="px-5 py-5 flex flex-col items-center gap-4">
              <div
                className="font-mono text-[26px] sm:text-[30px] font-black tracking-[0.18em] text-success select-all leading-none"
                aria-label={`Access code: ${state.accessCode}`}
              >
                {state.accessCode}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-medium">
                <CheckCircle2 size={12} strokeWidth={2} aria-hidden />
                Valid for 4 months from activation
              </div>
              <motion.button
                type="button"
                onClick={() => handleCopyCode(state.accessCode)}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.12, ease: standardEasing }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/[0.16] text-white text-[12px] font-semibold rounded-xl transition-colors"
                aria-label="Copy access code to clipboard"
              >
                {copied ? (
                  <>
                    <ClipboardCheck size={14} strokeWidth={2} aria-hidden />
                    Copied to Clipboard
                  </>
                ) : (
                  <>
                    <ClipboardCopy size={14} strokeWidth={2} aria-hidden />
                    Copy Access Code
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Next steps */}
        <motion.div variants={staggerItem} className="w-full mb-6">
          <InfoCard className="px-4 py-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3.5">
              What to do next
            </p>
            <ol className="space-y-3">
              {[
                'Check your inbox — we sent a confirmation copy with a direct registration link.',
                'Paste your access code into the registration form to create your account.',
                'Already have an account? Sign in — your code is already valid.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-ink/80 leading-snug">
                  <span className="w-5 h-5 bg-ink text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </InfoCard>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={staggerItem} className="w-full space-y-3">
          <motion.div {...scaleTap}>
            <Link
              href={`/register?code=${encodeURIComponent(state.accessCode)}`}
              className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors shadow-sm"
            >
              <CheckCircle2 size={18} strokeWidth={2.2} aria-hidden />
              Create Account with Code
            </Link>
          </motion.div>

          <motion.div {...scaleTap}>
            <Link
              href="/login"
              className="w-full min-h-[48px] bg-bg-0 border border-border-2 text-ink rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 hover:bg-bg-2 transition-colors"
            >
              Already have an account? Sign In
              <ArrowRight size={15} strokeWidth={2.2} aria-hidden />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // ── Organisation success ─────────────────────────────────────────────────
  if (state.status === 'success' && state.paymentType === 'organisation') {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center"
      >
        {/* Success badge */}
        <motion.div variants={staggerItem} className="mb-5">
          <div className="relative inline-flex">
            <div className="w-[72px] h-[72px] rounded-full bg-success-bg flex items-center justify-center">
              <CheckCircle2 size={36} strokeWidth={1.75} className="text-success" aria-hidden />
            </div>
            <span className="absolute inset-0 rounded-full animate-ping bg-success-bg opacity-60" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={staggerItem} className="mb-5">
          <h1 className="font-black text-[28px] text-ink tracking-tight leading-none mb-2">
            Thank You!
          </h1>
          {state.orgName && (
            <p className="text-[14px] font-bold text-ink mb-1">{state.orgName}</p>
          )}
          <p className="text-[13px] text-muted leading-snug max-w-[300px] mx-auto">
            Admin credentials and student access codes (4-month lifespan) are on their way to your inbox.
          </p>
        </motion.div>

        {/* Confirmation card */}
        <motion.div variants={staggerItem} className="w-full mb-5">
          <InfoCard className="px-4 py-4 text-left">
            {/* Email row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={16} strokeWidth={2} className="text-white" aria-hidden />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-0.5">
                  Sending to
                </p>
                <p className="text-[13px] font-semibold text-ink break-all font-mono leading-tight">
                  {state.adminEmail}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5 pt-4 border-t border-border">
              {[
                'Admin login URL + one-time temporary password',
                'CSV file with all student access codes attached',
                'Payment receipt & 4-month license details',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-[12px] text-ink/80">
                  <Mail size={13} strokeWidth={2} className="text-success flex-shrink-0 mt-0.5" aria-hidden />
                  {item}
                </div>
              ))}
            </div>

            {/* Amount */}
            {state.totalAmountNaira > 0 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-[12px] font-medium text-muted">Total paid</span>
                <span className="font-black text-[15px] text-ink tracking-tight">
                  ₦{state.totalAmountNaira.toLocaleString('en-NG')}
                </span>
              </div>
            )}
          </InfoCard>
        </motion.div>

        {/* CTA */}
        <motion.div variants={staggerItem} className="w-full">
          <motion.div {...scaleTap}>
            <Link
              href="/login"
              className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors shadow-sm"
            >
              Sign In as Admin
              <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: standardEasing }}
      className="flex flex-col items-center text-center pt-4 pb-2"
    >
      <div className="w-[64px] h-[64px] rounded-full bg-danger-bg border border-danger/20 flex items-center justify-center mb-5">
        <AlertCircle size={28} strokeWidth={2} className="text-danger" aria-hidden />
      </div>

      <h1 className="font-black text-[24px] text-ink tracking-tight leading-none mb-2">
        Verification Failed
      </h1>
      <p className="text-[13px] text-muted leading-snug mb-8 max-w-[260px]">
        We could not confirm your payment. Please try again or contact support.
      </p>

      <motion.div {...scaleTap} className="w-full mb-3">
        <Link
          href="/pay/individual"
          className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors shadow-sm"
        >
          <RefreshCw size={16} strokeWidth={2.2} aria-hidden />
          Try Again
        </Link>
      </motion.div>

      <p className="text-[12px] text-muted">
        Need help?{' '}
        <a
          href="mailto:support@definam.ng"
          className="text-ink font-bold hover:text-ink/70 transition-colors underline underline-offset-2"
        >
          Contact support
        </a>
      </p>
    </motion.div>
  );
}

// ── Fallback shown while CallbackContent hydrates ─────────────────────────

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] gap-5">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-border-2" />
        <Loader2
          size={40}
          strokeWidth={1.5}
          className="text-ink animate-spin absolute inset-0 m-auto"
          aria-hidden
        />
      </div>
      <p className="text-[14px] font-semibold text-ink">Verifying payment…</p>
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────

export default function CallbackPage() {
  return (
    <div className="min-h-screen bg-bg-0">
      {/* App bar */}
      <header className="flex items-center px-4 h-[56px] border-b border-border bg-bg-0 sticky top-0 z-10">
        <span className="text-[15px] font-bold text-ink tracking-tight">Payment</span>
      </header>

      <main className="px-5 pt-8 pb-16 sm:max-w-md sm:mx-auto sm:pt-12">
        <Suspense fallback={<LoadingFallback />}>
          <CallbackContent />
        </Suspense>
      </main>
    </div>
  );
}
