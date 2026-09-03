'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { loginUser, logout, ApiError } from '@/lib/api/auth';
import LandingBrandMark from '@/components/landing/LandingBrandMark';

function ResetSuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('reset') !== '1') return null;
  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-jade/10 border border-jade/20 text-jade text-[14px] font-medium leading-snug"
    >
      Your password has been reset. You can now log in with your new password.
    </div>
  );
}

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
      const { role } = await loginUser({
        username_or_email: values.username,
        password: values.password,
      });
      if (role === 'admin') {
        // Admin accounts must use the admin portal
        setBannerError('Use the admin login page for administrator accounts.');
        try {
          await logout();
        } catch {
          // Ignore logout failures to preserve the specific banner error
        }
        return;
      }
      // The student home page already fetches the display name via
      // getHomeData() — read this flag there rather than duplicating that
      // fetch here just for a greeting.
      sessionStorage.setItem('celebrate_login', '1');
      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setBannerError('Incorrect username or password.');
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <LandingBrandMark size={28} />
        <span className="font-bold text-[18px] text-[#111827] tracking-tight">Recall</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight mb-1">
            Sign in
          </h1>
          <p className="text-[14px] text-[#6B7280]">
            Enter your username and password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:ring-2 transition-all ${
                errors.username
                  ? 'border-[#EF4444] focus:ring-red-100'
                  : 'border-[#D1D5DB] focus:border-[#16A34A] focus:ring-green-100'
              }`}
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
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-12 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? 'border-[#EF4444] focus:ring-red-100'
                    : 'border-[#D1D5DB] focus:border-[#16A34A] focus:ring-green-100'
                }`}
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
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-[#6B7280]">
          No account?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#111827] hover:text-[#16A34A] transition-colors"
          >
            Create one
          </Link>{' '}
          Administrator?{' '}
          <Link
            href="/admin/login"
            className="font-semibold text-[#111827] hover:text-[#16A34A] transition-colors"
          >
            Log in here
          </Link>
        </p>
      </div>
      <p className="mt-6 text-[13px] text-[#9CA3AF]">
        &copy; Recall 2026
      </p>
    </div>
  );
}
