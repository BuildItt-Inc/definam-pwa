'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/validations/auth';
import { resetPassword, ApiError } from '@/lib/api/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setBannerError(null);
    try {
      await resetPassword({ token: token!, new_password: values.new_password });
      router.push('/login?reset=1');
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 400 || err.status === 401 || err.status === 410 || err.status === 422)
      ) {
        setTokenInvalid(true);
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-danger" strokeWidth={2} />
        </div>
        <h1 className="text-[24px] font-bold text-ink tracking-tight leading-tight mb-3">
          Invalid reset link
        </h1>
        <p className="text-[15px] text-muted mb-8 leading-relaxed">
          This link is missing a reset token.
        </p>
        <Link
          href="/forgot-password"
          className="text-[14px] font-bold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (tokenInvalid) {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-danger" strokeWidth={2} />
        </div>
        <h1 className="text-[24px] font-bold text-ink tracking-tight leading-tight mb-3">
          Link expired or already used
        </h1>
        <p className="text-[15px] text-muted mb-8 leading-relaxed">
          Reset links are single-use and expire after 1 hour.
        </p>
        <Link
          href="/forgot-password"
          className="text-[14px] font-bold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-[28px] font-bold text-ink tracking-tight leading-none mb-2 md:text-center">
        Set new password
      </h1>
      <p className="text-[15px] text-muted mb-8 md:text-center">
        Choose a strong password for your account
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── New Password ── */}
        <div className="mb-4">
          <label
            htmlFor="new_password"
            className="block mb-2 text-[14px] font-medium text-ink"
          >
            <Lock size={12} strokeWidth={2.5} aria-hidden />
            New password
          </label>
          <div className="relative">
            <input
              id="new_password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input-field pr-12 ${errors.new_password ? 'error' : ''}`}
              {...register('new_password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={2} />
              ) : (
                <Eye size={18} strokeWidth={2} />
              )}
            </button>
          </div>
          {errors.new_password && (
            <p className="mt-1.5 text-[13px] leading-none text-danger">
              {errors.new_password.message}
            </p>
          )}
        </div>

        {/* ── Confirm Password ── */}
        <div className="mb-6">
          <label
            htmlFor="confirm_password"
            className="block mb-2 text-[14px] font-medium text-ink"
          >
            <Lock size={12} strokeWidth={2.5} aria-hidden />
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input-field pr-12 ${errors.confirm_password ? 'error' : ''}`}
              {...register('confirm_password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} strokeWidth={2} />
              ) : (
                <Eye size={18} strokeWidth={2} />
              )}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="mt-1.5 text-[13px] leading-none text-danger">
              {errors.confirm_password.message}
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
              Reset password
              <KeyRound size={18} strokeWidth={2} />
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
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();

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
          Reset Password
        </span>
      </header>

      <main className="flex-1 flex flex-col justify-center px-5 py-12 md:max-w-md md:mx-auto w-full">
        <div className="md:bg-card md:border md:border-border md:rounded-2xl md:p-8 md:shadow-sm">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
