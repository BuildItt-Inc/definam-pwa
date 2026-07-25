'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth';
import { registerUser, ApiError } from '@/lib/api/auth';
import LogoMark from '@/components/landing/LogoMark';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Pre-filled from the payment celebration's handoff (?code=...) so the
  // customer doesn't have to dig the code back out of their email.
  const prefilledCode = searchParams.get('code') ?? '';

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
    defaultValues: { access_code: prefilledCode },
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
        if (err.status === 409 || (err.status === 400 && err.message === 'Username already taken')) {
          setError('username', { type: 'server', message: 'Username already taken' });
        } else if (err.status === 400 && err.message === 'Invalid access code') {
          setError('access_code', { type: 'server', message: 'That access code is not valid' });
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

  const fieldClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-2.5 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-[#EF4444] focus:ring-red-100'
        : 'border-[#D1D5DB] focus:border-[#16A34A] focus:ring-green-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <LogoMark size={28} />
        <span className="font-bold text-[18px] text-[#111827] tracking-tight">Recall</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight mb-1">
            Create an account
          </h1>
          <p className="text-[14px] text-[#6B7280]">
            You need an access code from your school or a Recall subscription.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {/* Access Code */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="access_code" className="text-[14px] font-medium text-[#111827]">
              Access code
            </label>
            <input
              id="access_code"
              type="text"
              autoCapitalize="characters"
              placeholder="e.g. SCH-12345"
              className={fieldClass(!!errors.access_code)}
              {...register('access_code')}
            />
            {errors.access_code && (
              <p className="text-[13px] text-[#EF4444]">{errors.access_code.message}</p>
            )}
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-[14px] font-medium text-[#111827]">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="e.g. chisom123"
              className={fieldClass(!!errors.username)}
              {...register('username')}
            />
            {errors.username && (
              <p className="text-[13px] text-[#EF4444]">{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[14px] font-medium text-[#111827]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Choose a password"
                className={`${fieldClass(!!errors.password)} pr-12`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[13px] text-[#EF4444]">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm_password" className="text-[14px] font-medium text-[#111827]">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`${fieldClass(!!errors.confirm_password)} pr-12`}
                {...register('confirm_password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-[13px] text-[#EF4444]">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Error banner */}
          {bannerError && (
            <div
              role="alert"
              className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[14px] text-[#DC2626]"
            >
              {bannerError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-xl bg-[#111827] text-white text-[15px] font-semibold py-3 flex items-center justify-center gap-2 hover:bg-[#1F2937] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-[#6B7280]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#111827] hover:text-[#16A34A] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-[13px] text-[#9CA3AF]">
        &copy; Recall 2026
      </p>
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
