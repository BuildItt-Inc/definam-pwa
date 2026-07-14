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
      const { role } = await loginUser(values);
      router.push(role === 'admin' ? '/admin/login' : '/student');
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
          Login
        </span>
      </header>

      <main className="px-5 pt-8 pb-12 md:max-w-md md:mx-auto md:pt-12">
        {/* Page heading */}
        <h1 className="text-[28px] font-bold text-ink tracking-tight leading-none mb-1.5">
          Welcome back
        </h1>
        <p className="text-[15px] text-muted mb-8">
          Login with your username and password
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          <div className="mb-8">
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
                placeholder="Enter your password"
                className={`input-field pr-12 ${errors.password ? 'error' : ''}`}
                {...register('password')}
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
            {errors.password && (
              <p className="mt-1.5 text-[13px] leading-none text-danger">
                {errors.password.message}
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
                Login
                <LogIn size={18} strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        <div className="space-y-4">
          <p className="text-center text-[14px] text-muted">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-bold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
