'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth';
import { registerUser, ApiError } from '@/lib/api/auth';
import LandingBrandMark from '@/components/landing/LandingBrandMark';

function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { access_code: '' },
  });

  async function onSubmit(values: RegisterFormValues) {
    setBannerError(null);
    try {
      await registerUser({
        username: values.username,
        password: values.password,
        confirm_password: values.confirm_password,
        access_code: values.access_code,
      });
      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          err.status === 409 ||
          (err.status === 400 && err.message.toLowerCase().includes('username'))
        ) {
          setError('username', {
            type: 'server',
            message: err.message || 'That username is already taken',
          });
        } else if (
          err.status === 400 &&
          (err.message.toLowerCase().includes('access code') ||
            err.message.toLowerCase().includes('code') ||
            err.message.toLowerCase().includes('join'))
        ) {
          setError('access_code', { type: 'server', message: err.message });
        } else if (err.status === 400) {
          setBannerError(err.message || 'Check your details and try again.');
        } else {
          setBannerError('Something went wrong. Please try again.');
        }
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-bg-0 flex flex-col items-center justify-center px-4 py-10 overflow-hidden">

      {/* Decorative blobs — CSS only, Android-safe */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.14) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.10) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <Link href="/" className="relative z-10 flex items-center gap-2 mb-8">
        <LandingBrandMark size={28} />
        <span className="font-bold text-lg text-ink tracking-tight">Recall</span>
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] bg-white rounded-2xl shadow-premium border border-border p-7">

        <h1 className="text-[22px] font-bold text-ink tracking-tight mb-1">
          Create your account
        </h1>
        <p className="text-sm text-muted mb-6">
          You need an access code to register. Check your email for it.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

          {/* Access Code */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="access_code" className="text-sm font-semibold text-ink-2">
              Access code
            </label>
            <input
              id="access_code"
              type="text"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="e.g. IND-A1B2-C3"
              className={`input-field font-mono tracking-wider ${errors.access_code ? 'error' : ''}`}
              {...register('access_code')}
            />
            {errors.access_code ? (
              <p className="text-xs text-danger">{errors.access_code.message}</p>
            ) : (
              <p className="text-xs text-faint">
                This was sent to your email when you purchased Recall
              </p>
            )}
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-semibold text-ink-2">
              Choose a username
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
            {errors.username ? (
              <p className="text-xs text-danger">{errors.username.message}</p>
            ) : (
              <p className="text-xs text-faint">This is what you&apos;ll use to sign in</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-ink-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
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

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm_password" className="text-sm font-semibold text-ink-2">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`input-field pr-12 ${errors.confirm_password ? 'error' : ''}`}
                {...register('confirm_password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-faint active:text-muted transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword
                  ? <EyeOff size={17} strokeWidth={2} />
                  : <Eye size={17} strokeWidth={2} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-danger">{errors.confirm_password.message}</p>
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
              : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-ink hover:text-brand transition-colors"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-3 text-center text-xs text-muted">
          School gave you a code?{' '}
          <Link
            href="/join"
            className="font-semibold text-brand hover:text-brand-dark transition-colors"
          >
            Use it here
          </Link>
        </p>
      </div>

      <p className="relative z-10 mt-6 text-xs text-faint">© Recall 2026</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}