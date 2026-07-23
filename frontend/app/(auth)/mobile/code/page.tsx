'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  DoorOpen,
  Loader2,
} from 'lucide-react';

import { orgLoginSchema, type OrgLoginFormValues } from '@/lib/validations/auth';
import { orgLogin, ApiError } from '@/lib/api/auth';
import { InfoCard } from '@/components/ui/InfoCard';

export default function OrgCodePage() {
  const router = useRouter();
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgLoginFormValues>({
    resolver: zodResolver(orgLoginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  async function onSubmit(values: OrgLoginFormValues) {
    setBannerError(null);
    setIsSubmitting(true);
    try {
      await orgLogin({
        access_code: values.access_code,
        user_agent: navigator.userAgent,
        ip: '0.0.0.0',
      });
      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        setBannerError(err.message || 'Invalid or already used access code');
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-0">

      {/* ── App bar ── */}
      <header className="flex items-center gap-3 px-4 h-[56px] border-b border-border-2 bg-bg-0">
        <button
          type="button"
          onClick={() => router.push('/mobile')}
          aria-label="Go back"
          className="flex items-center justify-center w-10 h-10 -ml-1 rounded-lg text-ink hover:bg-ink/6 active:bg-ink/10 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="text-[15px] font-bold text-ink tracking-tight">
          Student Access
        </span>
      </header>

      <main className="px-5 pt-6 pb-12 md:max-w-md md:mx-auto md:pt-8">

        {/* ── Info card ── */}
        <InfoCard
          icon={Building2}
          iconStyle="pill"
          title="Your school paid for your access"
          body="Enter the unique code your school gave you. This code is your permanent login — no password needed."
          className="mb-6"
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── Code label ── */}
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink/35 mb-2.5">
            Your Access Code
          </p>

          {/* ── Code input box ── */}
          <div
            className={[
              'rounded-xl border-2 py-4 px-4 mb-2 text-center transition-colors',
              errors.access_code ? 'border-danger' : 'border-ink',
            ].join(' ')}
          >
            <input
              id="access-code"
              type="text"
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="characters"
              inputMode="text"
              placeholder="DA-0000-KX"
              className={[
                'w-full bg-transparent text-center outline-none',
                'font-mono text-[22px] font-extrabold tracking-[0.18em] uppercase',
                errors.access_code
                  ? 'text-danger placeholder:text-danger/25'
                  : 'text-ink placeholder:text-ink/25',
              ].join(' ')}
              {...register('access_code')}
            />
          </div>

          {/* ── Field error ── */}
          {errors.access_code && (
            <p className="mb-2 ml-0.5 text-[11px] leading-none text-danger">
              {errors.access_code.message}
            </p>
          )}

          {/* ── Helper text ── */}
          <p className="text-[12px] text-ink/35 text-center mb-5">
            Given to you by your teacher or school admin
          </p>

          {/* ── Error banner ── */}
          {bannerError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-danger-bg border border-danger/25 text-danger text-[13px] font-medium leading-snug mb-4"
            >
              <AlertCircle
                size={16}
                strokeWidth={2}
                className="flex-shrink-0 mt-0.5"
                aria-hidden
              />
              {bannerError}
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[52px] bg-ink text-white rounded-xl font-bold text-[15px] tracking-tight flex items-center justify-center gap-2 hover:bg-ink/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-sm mb-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                Verifying…
              </>
            ) : (
              <>
                <DoorOpen size={18} strokeWidth={2.2} aria-hidden />
                Enter Recall
              </>
            )}
          </button>

        </form>

        {/* ── "How it works" divider ── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-black/8" />
          <span className="text-[11px] font-medium text-ink/30">How it works</span>
          <div className="flex-1 h-px bg-black/8" />
        </div>

        {/* ── Steps ── */}
        <ol className="space-y-3">
          {([
            'Your school paid ₦1,700 per student per term',
            'The system generated a unique code for each student',
            'Enter your code once — this device is now your Recall login forever',
          ] as const).map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 bg-bg-2 border border-border-2 rounded-[5px] flex items-center justify-center text-[9px] font-black text-ink flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-[12px] text-ink/50 leading-snug">{text}</span>
            </li>
          ))}
        </ol>

      </main>
    </div>
  );
}
