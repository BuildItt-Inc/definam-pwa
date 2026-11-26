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
  const [codeTouched, setCodeTouched] = useState(Boolean(codeParam));
  const [codeServerError, setCodeServerError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (codeParam) {
      setAccessCode(codeParam.toUpperCase());
      setCodeTouched(true);
    }
  }, [codeParam]);

  // Strict individual/beta access code format validation (DB check happens on submit)
  const normalizedCode = accessCode.trim().toUpperCase();
  const looksLikeOrgCode = /^DA-/.test(normalizedCode);
  const isAccessCodeFormatValid =
    /^(IND-[A-Z0-9]{4}-[A-Z0-9]{2,4}|BETA-[A-Z0-9]{6,10}|SMOKE-[A-Z0-9]{2,6}-[A-Z0-9]{2,6})$/.test(
      normalizedCode,
    );
  const showCodeFormatError =
    !isAccessCodeFormatValid &&
    normalizedCode.length > 0 &&
    (codeTouched || (normalizedCode.length >= 6 && !/^(IND|BETA|SMOKE)/i.test(normalizedCode)));
  const isAccessCodeValid = isAccessCodeFormatValid && !codeServerError;

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
          const msg = err.message || 'Invalid or expired access code.';
          setCodeServerError(msg);
          setBannerError(msg);
        } else if (err.status === 404 || err.status === 409) {
          if (err.message.toLowerCase().includes('code')) {
            setCodeServerError(err.message);
          }
          setBannerError(err.message || 'Check your details and try again.');
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
    <div className="min-h-screen bg-bg-0 flex flex-col justify-center px-4 py-8 sm:py-12">
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
          className="text-ink -ml-1 mb-3 p-1.5 min-h-[44px] min-w-[44px] text-ink/80 hover:text-ink active:scale-95 transition-all inline-flex items-center"
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
            className="mb-4 rounded-xl border border-danger/25 bg-danger-bg px-4 py-3 text-[13.5px] text-danger font-medium"
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
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  if (codeServerError) setCodeServerError(null);
                  if (bannerError) setBannerError(null);
                }}
                onBlur={() => {
                  if (normalizedCode.length > 0) setCodeTouched(true);
                }}
                placeholder="e.g. IND-7K2M-Q9"
                className={`w-full rounded-lg border ${
                  codeServerError || looksLikeOrgCode || showCodeFormatError
                    ? 'border-danger border-2 ring-1 ring-[#B42318]/15 focus:border-danger'
                    : isAccessCodeFormatValid
                    ? 'border-ink focus:border-ink'
                    : 'border-border-2 focus:border-ink focus:ring-2 focus:ring-[#14201B]/10'
                } bg-card px-4 py-3 pr-11 text-[16px] sm:text-[15px] font-mono font-bold tracking-wider text-ink placeholder:text-faint placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:outline-none transition-all touch-manipulation`}
              />
              {(codeServerError || looksLikeOrgCode || showCodeFormatError) && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <AlertCircle size={18} className="text-danger stroke-[2.2]" />
                </div>
              )}
            </div>
            {codeServerError ? (
              <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-medium text-danger leading-snug">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-danger" />
                <span>{codeServerError}</span>
              </p>
            ) : looksLikeOrgCode ? (
              <p className="mt-1.5 text-[12.5px] font-medium text-danger leading-snug">
                That looks like a school code (DA-…).{' '}
                <Link href="/join" className="underline font-bold">
                  Use School Student Access instead
                </Link>
                .
              </p>
            ) : showCodeFormatError ? (
              <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-medium text-danger leading-snug">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-danger" />
                <span>Invalid code format. Enter the full code with dashes (e.g. IND-7K2M-Q9).</span>
              </p>
            ) : isAccessCodeFormatValid ? (
              <p className="mt-1.5 text-[12.5px] text-muted leading-snug">
                Format looks right · Your code will be verified when you create your account.
              </p>
            ) : (
              <p className="mt-1.5 text-[12px] text-muted leading-snug">
                Individual codes start with <span className="font-mono font-semibold text-ink-2">IND-</span> or <span className="font-mono font-semibold text-ink-2">BETA-</span>.
              </p>
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
                    isTooLong ? 'text-danger font-bold' : 'text-muted'
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
                className={`w-full rounded-lg border ${
                  usernameStatus === 'valid'
                    ? 'border-brand border-2 ring-1 ring-[#1E7A46]/15 focus:border-brand'
                    : usernameStatus === 'invalid'
                    ? 'border-danger border-2 ring-1 ring-[#B42318]/15 focus:border-danger'
                    : usernameStatus === 'warning'
                    ? 'border-warn border-2 ring-1 ring-[#B45309]/15 focus:border-warn'
                    : 'border-border-2 focus:border-ink focus:ring-2 focus:ring-[#14201B]/10'
                } bg-card px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-faint focus:outline-none transition-all touch-manipulation`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                {usernameStatus === 'valid' && (
                  <Check size={18} className="text-brand stroke-[2.8]" />
                )}
                {usernameStatus === 'invalid' && (
                  <AlertCircle size={18} className="text-danger stroke-[2.2]" />
                )}
              </div>
            </div>

            {/* TikTok-style real-time validation message */}
            <p
              className={`mt-1.5 text-[12.5px] leading-snug flex items-start gap-1.5 transition-colors ${
                usernameFeedback.type === 'error'
                  ? 'text-danger font-medium'
                  : usernameFeedback.type === 'warning'
                  ? 'text-warn font-medium'
                  : usernameFeedback.type === 'success'
                  ? 'text-brand font-medium'
                  : 'text-muted'
              }`}
            >
              {usernameFeedback.type === 'error' && (
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-danger" />
              )}
              {usernameFeedback.type === 'success' && (
                <Check size={14} className="mt-0.5 shrink-0 text-brand stroke-[2.5]" />
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
                className={`w-full rounded-lg border ${
                  isPasswordValid
                    ? 'border-brand border-2 ring-1 ring-[#1E7A46]/15'
                    : 'border-border-2'
                } bg-card px-4 py-3 pr-11 text-[16px] sm:text-[14.5px] text-ink placeholder:text-faint focus:border-ink focus:ring-2 focus:ring-[#14201B]/10 focus:outline-none transition-all touch-manipulation`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </div>

            {/* Criteria pill chips */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                  hasMinLength ? 'bg-brand-tint text-brand' : 'bg-bg-2 text-muted'
                }`}
              >
                <Check size={12} strokeWidth={2.8} className={hasMinLength ? 'text-brand' : 'text-faint'} />
                <span>8 or more characters</span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                  hasNumber ? 'bg-brand-tint text-brand' : 'bg-bg-2 text-muted'
                }`}
              >
                <Check size={12} strokeWidth={2.8} className={hasNumber ? 'text-brand' : 'text-faint'} />
                <span>One number</span>
              </div>
            </div>
          </div>

          {/* Submit CTA — Ink primary when ready, muted neutral when incomplete */}
          {isFormComplete ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-6 min-h-[48px] text-[15.5px]"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Create account'}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full mt-6 min-h-[48px] rounded-lg bg-bg-2 py-3 text-[15.5px] font-semibold text-faint cursor-not-allowed flex items-center justify-center transition-colors"
            >
              Create account
            </button>
          )}

          <p className="text-[12.5px] text-muted text-center mt-2.5">
            Fill in all fields above to continue.
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
