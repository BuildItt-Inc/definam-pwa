'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        confirm_password: values.confirm_password,
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

  return (
    <div className="min-h-screen bg-bg-0 page-enter">
      {/* App bar */}
      <header className="flex items-center gap-3 px-4 h-[56px] border-b border-border bg-bg-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-ink hover:bg-bg-1 active:bg-bg-2 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="text-[17px] font-bold text-ink tracking-tight">
          Create Account
        </span>
      </header>

      <main className="px-5 pt-8 pb-12 md:max-w-md md:mx-auto md:pt-12">
        {/* Page heading */}
        <h1 className="text-[28px] font-bold text-ink tracking-tight leading-none mb-1.5">
          Join DefinAm
        </h1>
        <p className="text-[15px] text-muted mb-8">
          Enter your details and access code to begin
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ── Access Code ── */}
          <div className="mb-4">
            <label
              htmlFor="access_code"
              className="flex items-center gap-1.5 mb-1 text-[12px] font-bold uppercase tracking-wide text-muted"
            >
              <KeyRound size={12} strokeWidth={2.5} aria-hidden />
              Access Code
            </label>
            <input
              id="access_code"
              type="text"
              placeholder="e.g. SCH-12345"
              className={`input-field ${errors.access_code ? 'error' : ''}`}
              {...register('access_code')}
            />
            {errors.access_code && (
              <p className="mt-1.5 text-[13px] leading-none text-danger">
                {errors.access_code.message}
              </p>
            )}
          </div>

          {/* ── Username ── */}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="flex items-center gap-1.5 mb-1 text-[12px] font-bold uppercase tracking-wide text-muted"
            >
              <User size={12} strokeWidth={2.5} aria-hidden />
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="e.g. chisom123"
              className={`input-field ${errors.username ? 'error' : ''}`}
              {...register('username')}
            />
            {errors.username && (
              <p className="mt-1.5 text-[13px] leading-none text-danger">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* ── Password ── */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="flex items-center gap-1.5 mb-1 text-[12px] font-bold uppercase tracking-wide text-muted"
            >
              <Lock size={12} strokeWidth={2.5} aria-hidden />
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`input-field pr-12 ${errors.password ? 'error' : ''}`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink transition-colors"
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={2} />
                ) : (
                  <Eye size={18} strokeWidth={2} />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-[13px] leading-none text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* ── Confirm Password ── */}
          <div className="mb-8">
            <label
              htmlFor="confirm_password"
              className="flex items-center gap-1.5 mb-1 text-[12px] font-bold uppercase tracking-wide text-muted"
            >
              <CircleCheck size={12} strokeWidth={2.5} aria-hidden />
              Confirm Password
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
                Create Account
                <UserPlus size={18} strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        <div className="space-y-4">
          <p className="text-center text-[14px] text-muted">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
