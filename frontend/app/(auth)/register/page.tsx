'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerUser, ApiError } from '@/lib/api/auth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code') || searchParams.get('access_code') || '';

  const [accessCode, setAccessCode] = useState(codeParam.toUpperCase());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (codeParam) {
      setAccessCode(codeParam.toUpperCase());
    }
  }, [codeParam]);

  // Validation criteria
  const isAccessCodeValid =
    /^[A-Z0-9]{2,5}-[A-Z0-9]{3,6}-[A-Z0-9]{2,6}$/i.test(accessCode.trim()) ||
    accessCode.trim().length >= 8;

  const isUsernameValid =
    username.trim().length >= 3 &&
    username.trim().length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(username.trim());

  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber;

  const isFormComplete = isAccessCodeValid && isUsernameValid && isPasswordValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormComplete || isSubmitting) return;

    setBannerError(null);
    setIsSubmitting(true);

    try {
      await registerUser({
        username: username.trim(),
        password,
        confirm_password: password,
        access_code: accessCode.trim().toUpperCase(),
      });
      sessionStorage.setItem('celebrate_login', '1');
      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          err.status === 409 ||
          (err.status === 400 && err.message.toLowerCase().includes('username'))
        ) {
          setBannerError(err.message || 'That username is already taken. Try another.');
        } else if (
          err.status === 400 &&
          (err.message.toLowerCase().includes('access code') ||
            err.message.toLowerCase().includes('code') ||
            err.message.toLowerCase().includes('join'))
        ) {
          setBannerError(err.message || 'Invalid or expired access code.');
        } else {
          setBannerError(err.message || 'Check your details and try again.');
        }
      } else {
        setBannerError('Something went wrong. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafbfa] flex flex-col justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[390px] mx-auto">
        {/* Back navigation button */}
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
          className="text-ink -ml-1 mb-3 p-1.5 text-ink/80 hover:text-ink active:scale-95 transition-all inline-flex items-center"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>

        {/* Page header */}
        <h1 className="text-[28px] sm:text-[30px] font-bold text-ink tracking-tight mb-1.5 leading-tight">
          Create your account
        </h1>
        <p className="text-[14.5px] text-muted mb-6 leading-relaxed">
          Enter the access code from your email, receipt or school.
        </p>

        {/* Server error banner */}
        {bannerError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 font-medium"
          >
            {bannerError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Access code */}
          <div>
            <label htmlFor="access_code" className="block text-[14px] font-bold text-ink mb-1.5">
              Access code
            </label>
            <div className="relative">
              <input
                id="access_code"
                type="text"
                autoCapitalize="characters"
                spellCheck={false}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. IND-7K2M-Q9"
                className={`w-full rounded-xl border ${
                  isAccessCodeValid
                    ? 'border-[#15803d] border-2 ring-1 ring-[#15803d]/20'
                    : 'border-gray-300'
                } bg-white px-4 py-3 pr-11 text-[16px] sm:text-[15px] font-mono font-bold tracking-wider text-ink placeholder:text-gray-400 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
              />
              {isAccessCodeValid && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Check size={18} className="text-[#15803d] stroke-[2.8]" />
                </div>
              )}
            </div>
            {isAccessCodeValid && (
              <div className="mt-2 rounded-xl bg-[#ecfdf5] border border-emerald-200/70 px-3.5 py-2.5 text-[13px] font-medium text-emerald-900 leading-snug">
                Code valid · 1 term (120 days). Access starts when you finish signing up.
              </div>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-[14px] font-bold text-ink mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="francisnaga"
                className={`w-full rounded-xl border ${
                  isUsernameValid
                    ? 'border-[#15803d] border-2 ring-1 ring-[#15803d]/20'
                    : 'border-gray-300'
                } bg-white px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
              />
              {isUsernameValid && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Check size={18} className="text-[#15803d] stroke-[2.8]" />
                </div>
              )}
            </div>
            <p className="mt-1.5 text-[12.5px] text-gray-500 leading-relaxed">
              Available. You&apos;ll use this to sign in. Letters and numbers only.
            </p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-[14px] font-bold text-ink mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className={`w-full rounded-xl border ${
                  isPasswordValid
                    ? 'border-[#15803d] border-2 ring-1 ring-[#15803d]/20'
                    : 'border-gray-300'
                } bg-white px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all touch-manipulation`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-ink transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </div>

            {/* Criteria checklist */}
            <div className="flex items-center gap-4 mt-2.5">
              <div
                className={`flex items-center gap-1.5 text-[12.5px] transition-colors ${
                  hasMinLength ? 'text-[#15803d] font-semibold' : 'text-gray-500'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                    hasMinLength
                      ? 'border-[#15803d] bg-[#15803d] text-white'
                      : 'border-gray-400 bg-transparent'
                  }`}
                >
                  {hasMinLength && <Check size={11} strokeWidth={3} />}
                </span>
                <span>8 or more characters</span>
              </div>

              <div
                className={`flex items-center gap-1.5 text-[12.5px] transition-colors ${
                  hasNumber ? 'text-[#15803d] font-semibold' : 'text-gray-500'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                    hasNumber
                      ? 'border-[#15803d] bg-[#15803d] text-white'
                      : 'border-gray-400 bg-transparent'
                  }`}
                >
                  {hasNumber && <Check size={11} strokeWidth={3} />}
                </span>
                <span>One number</span>
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          {isFormComplete ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 rounded-xl bg-brand py-3.5 text-[15.5px] font-bold text-white shadow-md hover:bg-brand-dark active:scale-[0.99] transition-all flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Create account'}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full mt-6 rounded-xl bg-[#dce7dd] py-3.5 text-[15.5px] font-bold text-[#5c7060] cursor-not-allowed flex items-center justify-center transition-colors"
            >
              Create account
            </button>
          )}

          <p className="text-[12.5px] text-gray-500 text-center mt-2.5">
            The button turns green when everything above is filled in.
          </p>
        </form>

        {/* Footer links */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-[14px] text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-brand hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-[14px] text-gray-600">
            No code yet?{' '}
            <Link
              href="/pay/individual"
              className="font-bold text-brand hover:underline underline-offset-4"
            >
              Get access
            </Link>
          </p>
        </div>
      </div>
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
