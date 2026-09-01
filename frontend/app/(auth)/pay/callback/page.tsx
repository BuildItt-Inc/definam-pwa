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
  | { status: 'error'; reference?: string; message?: string };

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
      setState({ status: 'error', message: 'No payment reference provided.' });
      return;
    }

    const paymentType = sessionStorage.getItem('payment_type') ?? 'individual';
    let cancelled = false;

    const pollVerification = async (attempt = 1): Promise<void> => {
      if (cancelled) return;
      try {
        const data = await verifyPayment(reference);
        if (cancelled) return;

        if (data.status === 'processing' && attempt < 4) {
          await new Promise((res) => setTimeout(res, attempt * 1500));
          return pollVerification(attempt + 1);
        }

        const isOrg =
          data.payment_type === 'organisation' ||
          data.payment_type === 'org' ||
          paymentType === 'organisation';

        if (isOrg) {
          const storedTotal = sessionStorage.getItem('total_amount_naira');
          const totalAmountNaira =
            parseInt(storedTotal ?? '0', 10) || (data.amount || 0);
          setState({
            status: 'success',
            paymentType: 'organisation',
            adminEmail:
              data.admin_email ||
              data.email ||
              sessionStorage.getItem('org_email') ||
              '',
            orgName: data.org_name || sessionStorage.getItem('org_name') || '',
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
              onRedirect: () => router.push('/register'),
            });
          } else {
            setState({
              status: 'error',
              reference,
              message:
                data.message ||
                'Payment confirmed, but your access code is still processing. Please check your email or contact support.',
            });
          }
        }
      } catch (err: any) {
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, 2000));
          return pollVerification(attempt + 1);
        }
        if (cancelled) return;
        setState({
          status: 'error',
          reference,
          message:
            err?.message || 'Payment verification failed or timed out.',
        });
      }
    };

    pollVerification();

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
            Payment confirmed. Your access code has been generated and sent to:
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
                Valid for term duration from activation
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
                'Check your email inbox for your generated access code.',
                'Copy the code from your email and paste it into the registration form to create your account.',
                'Already have an account? Sign in — your code is active.',
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
              href="/register"
              className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors shadow-sm"
            >
              <CheckCircle2 size={18} strokeWidth={2.2} aria-hidden />
              Proceed to Registration
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
            Admin credentials and student access code CSV are on their way to your inbox.
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
                'Admin login URL + temporary password',
                'CSV file with all student access codes attached',
                'Payment receipt & seat license details',
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
              href="/admin/login"
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
  const refText = state.reference ? `Ref: ${state.reference}` : '';
  const supportSubject = encodeURIComponent(
    `Payment Verification Inquiry - ${state.reference || 'No Ref'}`
  );
  const supportBody = encodeURIComponent(
    `Hello Support,\n\nI am having an issue verifying my payment.\nReference: ${state.reference || 'N/A'}\n\nPlease assist.\n`
  );

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
        Verification Pending or Unconfirmed
      </h1>
      <p className="text-[13px] text-muted leading-snug mb-4 max-w-[280px]">
        {state.message ||
          'We could not automatically confirm your payment yet. If you completed payment, your receipt was sent to your email.'}
      </p>

      {state.reference && (
        <div className="mb-6 px-3.5 py-2 bg-bg-2 border border-border rounded-xl font-mono text-[12px] text-ink">
          Transaction Reference: <span className="font-bold">{state.reference}</span>
        </div>
      )}

      <motion.div {...scaleTap} className="w-full mb-3">
        <a
          href={`mailto:support@definam.ng?subject=${supportSubject}&body=${supportBody}`}
          className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors shadow-sm"
        >
          <Mail size={16} strokeWidth={2.2} aria-hidden />
          Contact Support with Reference
        </a>
      </motion.div>

      <motion.div {...scaleTap} className="w-full mb-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full min-h-[44px] bg-bg-0 border border-border-2 text-ink rounded-xl font-semibold text-[13px] tracking-tight flex items-center justify-center gap-2 hover:bg-bg-2 transition-colors"
        >
          <RefreshCw size={14} strokeWidth={2} aria-hidden />
          Re-check Verification Status
        </button>
      </motion.div>
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
