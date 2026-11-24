'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Check, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { registerUser, ApiError } from '@/lib/api/auth';
import { AnalyticsEvents } from '@/lib/analytics';

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

// Real-time TikTok-style username analysis
  const trimmedUsername = username.trim();
  const hasSpaces = /\s/.test(username);
  const invalidCharacters = Array.from(new Set(username.match(/[^a-zA-Z0-9_]/g) || []));
  const hasInvalidChars = invalidCharacters.length > 0;
  const isTooShort = trimmedUsername.length > 0 && trimmedUsername.length < 3;
  const isTooLong = trimmedUsername.length > 20;

  const isUsernameValid =
    trimmedUsername.length >= 3 &&
    trimmedUsername.length <= 20 &&
    !hasSpaces &&
    !hasInvalidChars;

  // Real-time status & specific message
  let usernameStatus: 'empty' | 'valid' | 'invalid' | 'warning' = 'empty';
  let usernameFeedback: { type: 'neutral' | 'error' | 'warning' | 'success'; message: string } = {
    type: 'neutral',
    message: "Letters, numbers, and underscores only. You'll use this to sign in.",
  };

  if (username.length > 0) {
    if (hasSpaces) {
      usernameStatus = 'invalid';
      usernameFeedback = {
        type: 'error',
        message: 'Usernames cannot contain spaces. Use an underscore (_) instead.',
      };
    } else if (hasInvalidChars) {
      usernameStatus = 'invalid';
      const formattedChars = invalidCharacters
        .slice(0, 3)
        .map((c) => `"${c}"`)
        .join(', ');
      usernameFeedback = {
        type: 'error',
        message: `Special characters like ${formattedChars} are not allowed. Only letters, numbers, and underscores (_).`,
      };
    } else if (isTooLong) {
      usernameStatus = 'invalid';
      usernameFeedback = {
        type: 'error',
        message: 'Username cannot exceed 20 characters.',
      };
    } else if (isTooShort) {
      usernameStatus = 'warning';
      usernameFeedback = {
        type: 'warning',
        message: `Must be at least 3 characters (${trimmedUsername.length}/3).`,
      };
    } else if (isUsernameValid) {
      usernameStatus = 'valid';
      usernameFeedback = {
        type: 'success',
        message: "Username is available! You'll use this to sign in.",
      };
    }
  }

  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber;

  const isFormComplete = isAccessCodeValid && isUsernameValid && isPasswordValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAccessCodeValid) {
      setBannerError('Please enter a valid access code (e.g. IND-7K2M-Q9).');
      return;
    }
    if (!isUsernameValid) {
      if (hasSpaces) {
        setBannerError('Usernames cannot contain spaces. Use an underscore (_) instead.');
      } else if (hasInvalidChars) {
        setBannerError(`Your username contains special characters (${invalidCharacters.join(' ')}). Only letters, numbers, and underscores (_) are allowed.`);
      } else if (isTooShort) {
        setBannerError('Username must be at least 3 characters.');
      } else if (isTooLong) {
        setBannerError('Username cannot exceed 20 characters.');
      } else {
        setBannerError('Please enter a valid username (letters, numbers, and underscores only).');
      }
      return;
    }
    if (!isPasswordValid) {
      setBannerError('Password must be at least 8 characters and include at least one number.');
      return;
    }
    if (isSubmitting) return;

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
      AnalyticsEvents.signup({ role: 'student_individual', source: 'register' });
      AnalyticsEvents.codeRedeemed({ code_type: 'individual', code_prefix: accessCode.trim().slice(0, 4) });
      router.push('/onboarding');
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
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="username" className="text-[14px] font-bold text-ink">
                Username
              </label>
              {username.length > 0 && (
                <span
                  className={`text-[11px] font-mono ${
                    isTooLong ? 'text-red-600 font-bold' : 'text-gray-400'
                  }`}
                >
                  {username.length}/20
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="username"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. chisom123"
                className={`w-full rounded-xl border ${
                  usernameStatus === 'valid'
                    ? 'border-[#15803d] border-2 ring-1 ring-[#15803d]/20 focus:border-[#15803d]'
                    : usernameStatus === 'invalid'
                    ? 'border-red-500 border-2 ring-1 ring-red-500/20 focus:border-red-500'
                    : usernameStatus === 'warning'
                    ? 'border-amber-400 border-2 ring-1 ring-amber-400/20 focus:border-amber-400'
                    : 'border-gray-300 focus:border-brand focus:ring-1 focus:ring-brand'
                } bg-white px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-gray-400 focus:outline-none transition-all touch-manipulation`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                {usernameStatus === 'valid' && (
                  <Check size={18} className="text-[#15803d] stroke-[2.8]" />
                )}
                {usernameStatus === 'invalid' && (
                  <AlertCircle size={18} className="text-red-500 stroke-[2.2]" />
                )}
              </div>
            </div>

            {/* TikTok-style real-time validation message */}
            <p
              className={`mt-1.5 text-[12.5px] leading-snug flex items-start gap-1.5 transition-colors ${
                usernameFeedback.type === 'error'
                  ? 'text-red-600 font-medium'
                  : usernameFeedback.type === 'warning'
                  ? 'text-amber-700 font-medium'
                  : usernameFeedback.type === 'success'
                  ? 'text-emerald-700 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {usernameFeedback.type === 'error' && (
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
              )}
              {usernameFeedback.type === 'success' && (
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[2.5]" />
              )}
              <span>{usernameFeedback.message}</span>
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
