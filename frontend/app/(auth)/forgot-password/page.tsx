'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CircleCheck,
  Loader2,
  Mail,
  Send,
} from 'lucide-react';
import Link from 'next/link';

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validations/auth';
import { forgotPassword, ApiError } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setBannerError(null);
    try {
      await forgotPassword({ email: values.email });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setBannerError('Something went wrong. Please try again.');
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-card md:bg-bg-0 page-enter flex flex-col">
      {/* App bar */}
      <header className="flex items-center gap-3 px-4 h-[56px] border-b border-border bg-card md:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-ink hover:bg-bg-1 active:bg-bg-2 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="text-[17px] font-bold text-ink tracking-tight">
          Forgot Password
        </span>
      </header>

      <main className="flex-1 flex flex-col justify-center px-5 py-12 md:max-w-md md:mx-auto w-full">
        <div className="md:bg-card md:border md:border-border md:rounded-2xl md:p-8 md:shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-jade/10 flex items-center justify-center mb-4">
                <CircleCheck size={28} className="text-jade" strokeWidth={2} />
              </div>
              <h1 className="text-[24px] font-bold text-ink tracking-tight leading-tight mb-3">
                Check your email
              </h1>
              <p className="text-[15px] text-muted mb-8 leading-relaxed">
                If an account exists for that email, we&apos;ve sent a reset link.
              </p>
              <Link
                href="/login"
                className="text-[14px] font-bold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink transition-colors"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-[28px] font-bold text-ink tracking-tight leading-none mb-2 md:text-center">
                Forgot password?
              </h1>
              <p className="text-[15px] text-muted mb-8 md:text-center">
                Enter your email and we&apos;ll send you a reset link
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* ── Email ── */}
                <div className="mb-6">
                  <label
                    htmlFor="email"
                    className="block mb-2 text-[14px] font-medium text-ink"
                  >
                    <Mail size={12} strokeWidth={2.5} aria-hidden />
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className={`input-field ${errors.email ? 'error' : ''}`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-[13px] leading-none text-danger">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Error Banner */}
                {bannerError && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[14px] font-medium leading-snug"
                  >
                    {bannerError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full shadow-brand-sm disabled:opacity-60 flex items-center justify-center gap-2 py-3.5 mb-8"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send reset link
                      <Send size={18} strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              <div>
                <p className="text-center text-[14px] text-muted">
                  Remember your password?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink transition-colors"
                  >
                    Back to login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
