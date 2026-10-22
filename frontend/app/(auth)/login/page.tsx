'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { loginUser, logout, ApiError } from '@/lib/api/auth';
import RecallLogo from '@/components/ui/RecallLogo';

// ── Reset success banner (shown after /reset-password redirects here) ──────
function ResetSuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('reset') !== '1') return null;
  return (
    <div
      role="status"
      className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium"
    >
      <span aria-hidden className="text-emerald-600 font-bold">✓</span>
      Password updated. Sign in with your new password.
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  async function onSubmit(values: LoginFormValues) {
    setBannerError(null);
    setIsSubmitting(true);
    try {
      const { role } = await loginUser({
        username_or_email: values.username,
        password: values.password,
      });
      if (role === 'admin') {
        setBannerError('Use the admin portal to sign in as an administrator.');
        try { await logout(); } catch { /* ignore */ }
        return;
      }
      sessionStorage.setItem('celebrate_login', '1');
      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setBannerError('Wrong username or password. Please try again.');
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafbfa] flex flex-col justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[390px] mx-auto">
        {/* Back navigation button */}
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          aria-label="Go back"
          className="text-ink -ml-1 mb-2 p-1.5 text-ink/80 hover:text-ink active:scale-95 transition-all inline-flex items-center"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>

        {/* Brand logo mark */}
        <div className="mb-3">
          <RecallLogo markOnly className="h-10 w-10 text-brand" />
        </div>

        {/* Page header */}
        <h1 className="text-[28px] sm:text-[30px] font-bold text-ink tracking-tight mb-1.5 leading-tight">
          Welcome back
        </h1>
        <p className="text-[14.5px] text-muted mb-6">
          Sign in to keep your streak going.
        </p>

        {/* Reset success notification */}
        <Suspense fallback={null}>
          <ResetSuccessBanner />
        </Suspense>

        {/* Global error banner */}
        {bannerError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 font-medium"
          >
            {bannerError}
          </div>
        )}

        {/* Sign in form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-[14px] font-bold text-ink mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="e.g. chisom123"
              className={`w-full rounded-xl border ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              } bg-white px-4 py-3 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
              {...register('username')}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-[14px] font-bold text-ink">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[13px] font-bold text-brand hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your password"
                className={`w-full rounded-xl border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } bg-white px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-ink transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 rounded-xl bg-brand py-3.5 text-[15.5px] font-bold text-white shadow-sm hover:bg-brand-dark active:scale-[0.99] transition-all flex items-center justify-center disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-[12.5px]">
            <span className="bg-[#fafbfa] px-3 font-medium text-gray-500">
              New to Recall?
            </span>
          </div>
        </div>

        {/* Access code CTA */}
        <Link
          href="/register"
          className="w-full rounded-xl border border-gray-300 bg-white py-3.5 text-[15px] font-bold text-ink shadow-xs hover:bg-gray-50 active:scale-[0.99] transition-all text-center block"
        >
          I have an access code
        </Link>

        {/* Get access link */}
        <div className="text-center mt-5">
          <Link
            href="/pay/individual"
            className="text-[14.5px] font-bold text-brand underline underline-offset-4 hover:text-brand-dark transition-colors"
          >
            Get access
          </Link>
        </div>

        {/* Admin link */}
        <div className="text-center mt-8">
          <Link
            href="/admin/login"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            School administrator portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
