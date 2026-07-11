'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  User,
  UserPlus,
} from 'lucide-react';

import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth';
import { registerUser, ApiError } from '@/lib/api/auth';
import { InfoCard } from '@/components/ui/InfoCard';

export default function RegisterPage() {
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
  });

  async function onSubmit(values: RegisterFormValues) {
    setBannerError(null);
    try {
      await registerUser({
        username: values.username,
        password: values.password,
        access_code: values.access_code, // already trimmed + uppercased by zod transform
      });

      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('username', {
            type: 'server',
            message: 'Username already taken',
          });
        } else if (err.status === 400 && err.message === 'Username already taken') {
          setError('username', {
            type: 'server',
            message: 'Username already taken',
          });
        } else if (err.status === 400 && err.message === 'Invalid access code') {
          setError('access_code', {
            type: 'server',
            message: 'Invalid access code',
          });
        } else if (err.status === 400) {
          setBannerError(err.message || 'Something went wrong. Please try again.');
        } else {
          setBannerError('Something went wrong. Please try again.');
        }
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    }
  }

  function fieldBorder(hasError: boolean) {
    return [
      'border rounded-xl transition-colors',
      hasError
        ? 'border-coral'
        : 'border-black/15 focus-within:border-jade',
    ].join(' ');
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
          Create Your Account
        </span>
      </header>

      <main className="px-5 pt-7 pb-12 md:max-w-md md:mx-auto md:pt-10">
        {/* Payment confirmed card */}
        <InfoCard
          icon={CircleCheck}
          iconStyle="bare"
          title="Payment confirmed"
          body="Access code sent to your email"
          className="mb-7"
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ── Username ── */}
          <div className="mb-4">
            <div className={fieldBorder(!!errors.username)}>
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
          <div className="mb-4">
            <div className={fieldBorder(!!errors.password)}>
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
                  autoComplete="new-password"
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

          {/* ── Confirm password ── */}
          <div className="mb-4">
            <div className={fieldBorder(!!errors.confirm_password)}>
              <label
                htmlFor="confirm-password"
                className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-jade cursor-pointer"
              >
                <Lock size={11} strokeWidth={2.5} aria-hidden />
                Confirm Password
              </label>
              <div className="flex items-center px-3.5 pt-1.5 pb-3.5 gap-2">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="flex-1 min-w-0 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                  {...register('confirm_password')}
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="flex-shrink-0 text-ink/30 hover:text-ink/60 transition-colors p-0.5"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
            {errors.confirm_password && (
              <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-coral">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* ── Access code ── */}
          <div className="mb-7">
            <div className={fieldBorder(!!errors.access_code)}>
              <label
                htmlFor="access-code"
                className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-jade cursor-pointer"
              >
                <KeyRound size={11} strokeWidth={2.5} aria-hidden />
                Access Code (from your email)
              </label>
              <input
                id="access-code"
                type="text"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="characters"
                placeholder="IND-0000-XX"
                className="w-full px-3.5 pt-1.5 pb-3.5 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25 font-mono tracking-[0.15em] uppercase"
                {...register('access_code')}
              />
            </div>
            {errors.access_code && (
              <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-coral">
                {errors.access_code.message}
              </p>
            )}
          </div>

          {/* ── Error banner ── */}
          {bannerError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3.5 rounded-xl bg-coral/10 border border-coral/25 text-coral text-[13px] font-medium leading-snug"
            >
              {bannerError}
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[52px] bg-jade text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-jade/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                Creating account…
              </>
            ) : (
              <>
                <UserPlus size={18} strokeWidth={2.2} aria-hidden />
                Create Account
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
