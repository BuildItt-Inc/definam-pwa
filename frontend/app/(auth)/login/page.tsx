'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  User,
} from 'lucide-react';
import Link from 'next/link';

import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { loginUser, ApiError } from '@/lib/api/auth';

export default function LoginPage() {
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
      await loginUser(values);
      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setBannerError('Invalid username or password');
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
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
          Login
        </span>
      </header>

      <main className="px-5 pt-8 pb-12 md:max-w-md md:mx-auto md:pt-12">
        {/* Page heading */}
        <h1 className="font-syne text-[28px] font-black text-ink tracking-tight leading-none mb-1.5">
          Welcome back
        </h1>
        <p className="text-[13px] text-ink/50 mb-8">
          Login with your username and password
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ── Username ── */}
          <div className="mb-4">
            <div
              className={[
                'border rounded-xl transition-colors',
                errors.username
                  ? 'border-coral'
                  : 'border-black/15 focus-within:border-jade',
              ].join(' ')}
            >
              <label
                htmlFor="username"
                className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-jade cursor-pointer"
              >
                <User size={11} strokeWidth={2.5} aria-hidden />
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
                placeholder="chukwuemeka_23"
                className="w-full px-3.5 pt-1.5 pb-3.5 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                {...register('username')}
              />
            </div>
            {errors.username && (
              <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-coral">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* ── Password ── */}
          <div className="mb-2">
            <div
              className={[
                'border rounded-xl transition-colors',
                errors.password
                  ? 'border-coral'
                  : 'border-black/15 focus-within:border-jade',
              ].join(' ')}
            >
              <label
                htmlFor="password"
                className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-jade cursor-pointer"
              >
                <Lock size={11} strokeWidth={2.5} aria-hidden />
                Password
              </label>
              <div className="flex items-center px-3.5 pt-1.5 pb-3.5 gap-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="flex-1 min-w-0 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex-shrink-0 text-ink/30 hover:text-ink/60 transition-colors p-0.5"
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-coral">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* ── Forgot password ── */}
          <div className="flex justify-end mb-7 pr-0.5">
            <Link
              href="/forgot-password"
              className="text-[12px] font-bold text-jade hover:text-jade/75 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* ── Error banner ── */}
          {bannerError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-coral/10 border border-coral/25 text-coral text-[13px] font-medium leading-snug"
            >
              {bannerError}
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[52px] bg-jade text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-jade/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mb-8 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                Logging in…
              </>
            ) : (
              <>
                <LogIn size={18} strokeWidth={2.2} aria-hidden />
                Login
              </>
            )}
          </button>

          {/* ── Sign-up prompt ── */}
          <p className="text-center text-[12px] text-ink/40">
            New?{' '}
            <Link
              href="/pay/individual"
              className="text-jade font-bold hover:text-jade/75 transition-colors"
            >
              Pay as Individual
            </Link>{' '}
            to get started
          </p>
        </form>
      </main>
    </div>
  );
}
