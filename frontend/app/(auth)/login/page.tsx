'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, School, User } from 'lucide-react';
import Link from 'next/link';

import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { loginUser, logout, ApiError } from '@/lib/api/auth';
import LandingBrandMark from '@/components/landing/LandingBrandMark';

// ── Reset success banner (shown after /reset-password redirects here) ──────
function ResetSuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('reset') !== '1') return null;
  return (
    <div
      role="status"
      className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-brand-tint border border-brand/20 text-brand text-sm font-medium"
    >
      <span aria-hidden>✓</span>
      Password updated. Sign in with your new password.
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
type Step = 'choose' | 'login';

function LoginContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');
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
    <div className="relative min-h-screen bg-bg-0 flex flex-col items-center justify-center px-4 py-10 overflow-hidden">

      {/* Ambient decorative blobs — pure CSS divs, no filter, works everywhere */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.14) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.10) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <Link href="/" className="relative z-10 flex items-center gap-2 mb-8">
        <LandingBrandMark size={28} />
        <span className="font-bold text-lg text-ink tracking-tight">Recall</span>
      </Link>

      {/* Card — solid white, no backdrop-filter, works on all Android devices */}
      <div className="relative z-10 w-full max-w-[400px] bg-white rounded-2xl shadow-premium border border-border p-7">

        {/* Reset success banner */}
        <Suspense fallback={null}>
          <ResetSuccessBanner />
        </Suspense>

        {step === 'choose' ? (
          /* ── Step 1: Role chooser ── */
          <div>
            <h1 className="text-[22px] font-bold text-ink tracking-tight mb-1">
              Sign in to Recall
            </h1>
            <p className="text-sm text-muted mb-6">
              How are you accessing Recall?
            </p>

            {/* Option 1 — School student */}
            <button
              type="button"
              onClick={() => router.push('/join')}
              className="w-full flex items-center gap-4 rounded-xl border-2 border-border-2 bg-bg-0 px-4 py-4 mb-3 text-left active:scale-[0.98] active:bg-bg-2 transition-transform"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-tint">
                <School size={20} className="text-brand" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink leading-tight">
                  My school signed me up
                </span>
                <span className="block text-[13px] text-muted mt-0.5">
                  Enter the code your school gave you
                </span>
              </span>
              <span className="text-faint text-lg flex-shrink-0" aria-hidden>›</span>
            </button>

            {/* Option 2 — Individual student */}
            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full flex items-center gap-4 rounded-xl border-2 border-border-2 bg-bg-0 px-4 py-4 text-left active:scale-[0.98] active:bg-bg-2 transition-transform"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ink/6">
                <User size={20} className="text-ink" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink leading-tight">
                  I have my own account
                </span>
                <span className="block text-[13px] text-muted mt-0.5">
                  Sign in with username and password
                </span>
              </span>
              <span className="text-faint text-lg flex-shrink-0" aria-hidden>›</span>
            </button>

            {/* Admin — subtle link, not a primary option */}
            <p className="mt-6 text-center text-xs text-faint">
              School administrator?{' '}
              <Link
                href="/admin/login"
                className="font-semibold text-muted hover:text-ink transition-colors underline underline-offset-2"
              >
                Go to admin portal
              </Link>
            </p>
          </div>
        ) : (
          /* ── Step 2: Login form ── */
          <div>
            {/* Back button */}
            <button
              type="button"
              onClick={() => { setStep('choose'); setBannerError(null); }}
              className="flex items-center gap-1 text-sm text-muted mb-5 -ml-0.5 active:opacity-60 transition-opacity"
            >
              <span aria-hidden>‹</span> Back
            </button>

            <h1 className="text-[22px] font-bold text-ink tracking-tight mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-muted mb-6">
              Sign in to your Recall account
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-sm font-semibold text-ink-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="e.g. chisom123"
                  className={`input-field ${errors.username ? 'error' : ''}`}
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-xs text-danger">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-semibold text-ink-2">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`input-field pr-12 ${errors.password ? 'error' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-faint active:text-muted transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff size={17} strokeWidth={2} />
                      : <Eye size={17} strokeWidth={2} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              {/* Error banner */}
              {bannerError && (
                <div
                  role="alert"
                  className="rounded-xl border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger"
                >
                  {bannerError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full mt-1"
              >
                {isSubmitting
                  ? <Loader2 size={18} className="animate-spin" />
                  : 'Sign in'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-muted">
              Need an account?{' '}
              <Link
                href="/register"
                className="font-semibold text-ink hover:text-brand transition-colors"
              >
                Register with your access code
              </Link>
            </p>
          </div>
        )}
      </div>

      <p className="relative z-10 mt-6 text-xs text-faint">© Recall 2026</p>
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
