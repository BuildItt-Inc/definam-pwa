'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import {
  adminLoginSchema,
  changePasswordSchema,
  type AdminLoginFormValues,
  type ChangePasswordFormValues,
} from '@/lib/validations/auth';
import { loginUser, logout, changePassword, ApiError } from '@/lib/api/auth';
import { InfoCard } from '@/components/ui/InfoCard';

export default function AdminLoginPage() {
  const router = useRouter();

  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  // Per-form show/hide password state
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Per-form banner error state
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
      const data = await loginUser(values);
      // Reject non-admin accounts immediately — don't let students land here
      if (data.role !== 'admin') {
        setLoginBannerError('This page is for administrators only.');
        await logout();
        return;
      }
      if (data.force_password_change) {
        setForcePasswordChange(true);
      } else {
        router.push('/admin');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setLoginBannerError('Invalid username or password');
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
      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setChangeBannerError(err.message || 'Something went wrong. Please try again.');
      } else {
        setChangeBannerError('Something went wrong. Please try again.');
      }
    }
  }

  // ── Shared field wrapper classes ──────────────────────────────────────
  function fieldBorder(hasError: boolean) {
    return [
      'border rounded-xl transition-colors',
      hasError
        ? 'border-danger'
        : 'border-border-2 focus-within:border-ink',
    ].join(' ');
  }

  // ═════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-bg-0">
      {/* App bar */}
      <header className="flex items-center px-4 h-[56px] border-b border-border-2 bg-bg-0">
        <span className="text-[15px] font-bold text-ink tracking-tight">
          Admin Login
        </span>
      </header>

      <main className="px-5 pt-8 pb-12 md:max-w-md md:mx-auto md:pt-12">

        {/* ── LOGIN FORM (hidden once force password change is active) ── */}
        {!forcePasswordChange && (
          <>
            <h1 className="font-bold text-[28px] font-black text-ink tracking-tight leading-none mb-1.5">
              School Admin Login
            </h1>
            <p className="text-[13px] text-ink/50 mb-8">
              Login to your DefinAm admin dashboard
            </p>

            <form onSubmit={handleLoginSubmit(onLoginSubmit)} noValidate>

              {/* Username / email */}
              <div className="mb-4">
                <div className={fieldBorder(!!loginErrors.username)}>
                  <label
                    htmlFor="admin-username"
                    className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-ink cursor-pointer"
                  >
                    <Mail size={11} strokeWidth={2.5} aria-hidden />
                    Username (your school email)
                  </label>
                  <input
                    id="admin-username"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    autoCapitalize="none"
                    placeholder="admin@kingsschool.edu.ng"
                    className="w-full px-3.5 pt-1.5 pb-3.5 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                    {...registerLogin('username')}
                  />
                </div>
                {loginErrors.username && (
                  <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-danger">
                    {loginErrors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-7">
                <div className={fieldBorder(!!loginErrors.password)}>
                  <label
                    htmlFor="admin-password"
                    className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-ink cursor-pointer"
                  >
                    <Lock size={11} strokeWidth={2.5} aria-hidden />
                    Password
                  </label>
                  <div className="flex items-center px-3.5 pt-1.5 pb-3.5 gap-2">
                    <input
                      id="admin-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="flex-1 min-w-0 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                      {...registerLogin('password')}
                    />
                    <button
                      type="button"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="flex-shrink-0 text-ink/30 hover:text-ink/60 transition-colors p-0.5"
                    >
                      {showLoginPassword ? (
                        <EyeOff size={16} strokeWidth={2} />
                      ) : (
                        <Eye size={16} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
                {loginErrors.password && (
                  <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-danger">
                    {loginErrors.password.message}
                  </p>
                )}
              </div>

              {/* Login error banner */}
              {loginBannerError && (
                <div
                  role="alert"
                  className="mb-4 px-4 py-3.5 rounded-xl bg-danger-bg border border-danger/25 text-danger text-[13px] font-medium leading-snug"
                >
                  {loginBannerError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-sm"
              >
                {isLoginSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden />
                    Logging in…
                  </>
                ) : (
                  <>
                    <LogIn size={18} strokeWidth={2.2} aria-hidden />
                    Login to Dashboard
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ── FORCE PASSWORD CHANGE BLOCK ─────────────────────────────── */}
        {forcePasswordChange && (
          <>
            <h1 className="font-bold text-[28px] font-black text-ink tracking-tight leading-none mb-1.5">
              Change Your Password
            </h1>
            <p className="text-[13px] text-ink/50 mb-6">
              Set a permanent password before you continue.
            </p>

            {/* warn warning banner */}
            <InfoCard
              tone="gold"
              icon={AlertTriangle}
              iconStyle="bare"
              title="First Login — Change Your Password"
              body="You're using a temporary password. Set a permanent one before you continue."
              className="mb-7"
            />

            <form
              onSubmit={handleChangeSubmit(onChangePasswordSubmit)}
              noValidate
            >
              {/* New password */}
              <div className="mb-4">
                <div className={fieldBorder(!!changeErrors.new_password)}>
                  <label
                    htmlFor="new-password"
                    className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-ink cursor-pointer"
                  >
                    <Lock size={11} strokeWidth={2.5} aria-hidden />
                    New Password
                  </label>
                  <div className="flex items-center px-3.5 pt-1.5 pb-3.5 gap-2">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="flex-1 min-w-0 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                      {...registerChange('new_password')}
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="flex-shrink-0 text-ink/30 hover:text-ink/60 transition-colors p-0.5"
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} strokeWidth={2} />
                      ) : (
                        <Eye size={16} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
                {changeErrors.new_password && (
                  <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-danger">
                    {changeErrors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="mb-7">
                <div className={fieldBorder(!!changeErrors.confirm_password)}>
                  <label
                    htmlFor="confirm-password"
                    className="flex items-center gap-1.5 px-3.5 pt-3 pb-0 text-[11px] font-bold uppercase tracking-wide text-ink cursor-pointer"
                  >
                    <Lock size={11} strokeWidth={2.5} aria-hidden />
                    Confirm New Password
                  </label>
                  <div className="flex items-center px-3.5 pt-1.5 pb-3.5 gap-2">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="flex-1 min-w-0 text-[14px] text-ink bg-transparent outline-none placeholder:text-ink/25"
                      {...registerChange('confirm_password')}
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                {changeErrors.confirm_password && (
                  <p className="mt-1.5 ml-0.5 text-[11px] leading-none text-danger">
                    {changeErrors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Change password error banner */}
              {changeBannerError && (
                <div
                  role="alert"
                  className="mb-4 px-4 py-3.5 rounded-xl bg-danger-bg border border-danger/25 text-danger text-[13px] font-medium leading-snug"
                >
                  {changeBannerError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isChangeSubmitting}
                className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-sm"
              >
                {isChangeSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden />
                    Saving…
                  </>
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
      </main>
    </div>
  );
}
