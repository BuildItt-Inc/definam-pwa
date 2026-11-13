'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

import {
  adminLoginSchema,
  changePasswordSchema,
  type AdminLoginFormValues,
  type ChangePasswordFormValues,
} from '@/lib/validations/auth';
import { loginUser, logout, changePassword, ApiError } from '@/lib/api/auth';
import { InfoCard } from '@/components/ui/InfoCard';
import RecallLogo from '@/components/ui/RecallLogo';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hint = searchParams.get('hint');
  const nextParam = searchParams.get('next');
  const nextPath =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/admin';

  const middlewareBanner =
    hint === 'not_admin'
      ? 'Access denied. This page is for administrators only.'
      : hint === 'session_error'
        ? 'Your session could not be verified. Please log in again.'
        : null;

  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginBannerError, setLoginBannerError] = useState<string | null>(null);
  const [changeBannerError, setChangeBannerError] = useState<string | null>(null);

  // ── Login form ─────────────────────────────────────────────────────────
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  // ── Change-password form ───────────────────────────────────────────────
  const {
    register: registerChange,
    handleSubmit: handleChangeSubmit,
    formState: { errors: changeErrors, isSubmitting: isChangeSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  // ── Submit: admin login ────────────────────────────────────────────────
  async function onLoginSubmit(values: AdminLoginFormValues) {
    setLoginBannerError(null);
    try {
      const data = await loginUser({
        username_or_email: values.username,
        password: values.password,
      });
      if (data.role !== 'admin' && data.role !== 'super_admin') {
        setLoginBannerError('This page is for administrators only.');
        try {
          await logout();
        } catch {
          // Ignore logout failures
        }
        return;
      }
      if (data.force_password_change) {
        setForcePasswordChange(true);
      } else {
        router.push(nextPath);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setLoginBannerError('Invalid username or password.');
      } else {
        setLoginBannerError('Something went wrong. Please try again.');
      }
    }
  }

  // ── Submit: change password ────────────────────────────────────────────
  async function onChangePasswordSubmit(values: ChangePasswordFormValues) {
    setChangeBannerError(null);
    try {
      await changePassword({
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      router.push(nextPath);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setChangeBannerError(err.message || 'Something went wrong. Please try again.');
      } else {
        setChangeBannerError('Something went wrong. Please try again.');
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#fafbfa] flex flex-col justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[390px] mx-auto">

        {/* Back navigation */}
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
          className="-ml-1 mb-2 p-1.5 text-ink/80 hover:text-ink active:scale-95 transition-all inline-flex items-center"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>

        {/* Brand logo */}
        <div className="mb-3">
          <RecallLogo markOnly className="h-10 w-10 text-brand" />
        </div>

        {/* ── LOGIN FORM ── */}
        {!forcePasswordChange && (
          <>
            <h1 className="text-[28px] sm:text-[30px] font-bold text-ink tracking-tight mb-1.5 leading-tight">
              Administrator Sign In
            </h1>
            <p className="text-[14.5px] text-muted mb-6">
              Sign in to manage classes, access codes, and platform analytics.
            </p>

            {/* Middleware redirect banner */}
            {middlewareBanner && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 font-medium"
              >
                {middlewareBanner}
              </div>
            )}

            {/* Login error banner */}
            {loginBannerError && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 font-medium"
              >
                {loginBannerError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit(onLoginSubmit)} noValidate className="space-y-4">
              {/* Username / email */}
              <div>
                <label htmlFor="admin-username" className="block text-[14px] font-bold text-ink mb-1.5">
                  Username or Email
                </label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder="admin@yourschool.edu"
                  className={`w-full rounded-xl border ${
                    loginErrors.username ? 'border-red-500' : 'border-gray-300'
                  } bg-white px-4 py-3 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
                  {...registerLogin('username')}
                />
                {loginErrors.username && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {loginErrors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="admin-password" className="block text-[14px] font-bold text-ink mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Your password"
                    className={`w-full rounded-xl border ${
                      loginErrors.password ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
                    {...registerLogin('password')}
                  />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-ink transition-colors"
                  >
                    {showLoginPassword ? (
                      <EyeOff size={18} strokeWidth={2} />
                    ) : (
                      <Eye size={18} strokeWidth={2} />
                    )}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {loginErrors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="w-full mt-2 rounded-xl bg-brand py-3.5 text-[15.5px] font-bold text-white shadow-sm hover:bg-brand-dark active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoginSubmitting ? (
                  <Loader2 size={18} className="animate-spin" aria-hidden />
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="mt-8 text-center text-[13px] text-muted">
              Not an administrator?{' '}
              <Link
                href="/login"
                className="font-semibold text-brand hover:text-brand-dark transition-colors"
              >
                Student Sign In
              </Link>
            </p>
          </>
        )}

        {/* ── FORCE PASSWORD CHANGE BLOCK ─────────────────────────────── */}
        {forcePasswordChange && (
          <>
            <h1 className="text-[28px] sm:text-[30px] font-bold text-ink tracking-tight mb-1.5 leading-tight">
              Set Your Password
            </h1>
            <p className="text-[14.5px] text-muted mb-6">
              Set a permanent password before you continue.
            </p>

            <InfoCard
              tone="gold"
              icon={AlertTriangle}
              iconStyle="bare"
              title="First Login — Change Your Password"
              body="You're using a temporary password. Set a permanent one before you continue."
              className="mb-6"
            />

            {/* Change password error banner */}
            {changeBannerError && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 font-medium"
              >
                {changeBannerError}
              </div>
            )}

            <form
              onSubmit={handleChangeSubmit(onChangePasswordSubmit)}
              noValidate
              className="space-y-4"
            >
              {/* New password */}
              <div>
                <label htmlFor="new-password" className="block text-[14px] font-bold text-ink mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className={`w-full rounded-xl border ${
                      changeErrors.new_password ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
                    {...registerChange('new_password')}
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-ink transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} strokeWidth={2} />
                    ) : (
                      <Eye size={18} strokeWidth={2} />
                    )}
                  </button>
                </div>
                {changeErrors.new_password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {changeErrors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm-password" className="block text-[14px] font-bold text-ink mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    className={`w-full rounded-xl border ${
                      changeErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
                    } bg-white px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
                    {...registerChange('confirm_password')}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-ink transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} strokeWidth={2} />
                    ) : (
                      <Eye size={18} strokeWidth={2} />
                    )}
                  </button>
                </div>
                {changeErrors.confirm_password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {changeErrors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isChangeSubmitting}
                className="w-full mt-2 rounded-xl bg-brand py-3.5 text-[15.5px] font-bold text-white shadow-sm hover:bg-brand-dark active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isChangeSubmitting ? (
                  <Loader2 size={18} className="animate-spin" aria-hidden />
                ) : (
                  <>
                    <ShieldCheck size={18} strokeWidth={2.2} aria-hidden />
                    Set Password &amp; Continue
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
