'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Flame, Hand, Loader2, Sparkle } from 'lucide-react';
import type { CelebrationPayload } from './CelebrationContext';

const LOGIN_DISMISS_MS = 1800;
const STREAK_DISMISS_MS = 2500;
const PAYMENT_CELEBRATE_MS = 12000;
const PAYMENT_REDIRECT_MS = 1000;

// Floating sparkle particles around the main icon — purely decorative,
// staggered so they don't all pulse in lockstep.
function Particles() {
  const offsets = [
    { left: '18%', delay: '0ms' },
    { left: '78%', delay: '350ms' },
    { left: '50%', delay: '650ms' },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {offsets.map((o, i) => (
        <Sparkle
          key={i}
          size={14}
          strokeWidth={2}
          className="celebration-particle absolute top-1/2 text-brand-light"
          style={{ left: o.left, animationDelay: o.delay }}
          fill="currentColor"
        />
      ))}
    </div>
  );
}

function CelebrationShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="celebration-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="celebration-card relative w-full max-w-[320px] rounded-2xl bg-card px-6 py-8 text-center shadow-xl">
        {children}
      </div>
    </div>
  );
}

export function CelebrationOverlay({
  payload,
  onDismiss,
}: {
  payload: CelebrationPayload;
  onDismiss: () => void;
}) {
  if (payload.type === 'login') {
    return <LoginCelebration name={payload.name} onDismiss={onDismiss} />;
  }
  if (payload.type === 'streak') {
    return <StreakCelebration days={payload.days} onDismiss={onDismiss} />;
  }
  return (
    <PaymentCelebration
      email={payload.email}
      accessCode={payload.accessCode}
      onRedirect={payload.onRedirect}
      onDismiss={onDismiss}
    />
  );
}

function LoginCelebration({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, LOGIN_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <CelebrationShell>
      <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink">
        <Hand size={30} strokeWidth={2} className="celebration-icon-wiggle text-white" />
      </div>
      <p className="text-[18px] font-bold text-ink">Welcome back, {name}!</p>
    </CelebrationShell>
  );
}

function StreakCelebration({ days, onDismiss }: { days: number; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, STREAK_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <CelebrationShell>
      <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink">
        <Particles />
        <Flame size={30} strokeWidth={2} className="celebration-icon-wiggle text-brand-light" fill="currentColor" />
      </div>
      <p className="text-[20px] font-bold text-ink">
        {days} day{days === 1 ? '' : 's'} streak
      </p>
      <p className="mt-1 text-[13px] text-muted">
        You showed up {days} day{days === 1 ? '' : 's'} in a row
      </p>
    </CelebrationShell>
  );
}

function PaymentCelebration({
  email,
  onRedirect,
  onDismiss,
}: {
  email: string;
  accessCode: string;
  onRedirect: () => void;
  onDismiss: () => void;
}) {
  const [phase, setPhase] = useState<'celebrate' | 'redirecting'>('celebrate');
  const [countdown, setCountdown] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    const t = setTimeout(() => setPhase('redirecting'), PAYMENT_CELEBRATE_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'redirecting') return;
    const t = setTimeout(() => {
      onDismiss();
      onRedirect();
    }, PAYMENT_REDIRECT_MS);
    return () => clearTimeout(t);
  }, [phase, onDismiss, onRedirect]);

  if (phase === 'redirecting') {
    return (
      <CelebrationShell>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink">
          <Loader2 size={28} strokeWidth={2} className="animate-spin text-white" />
        </div>
        <p className="text-[16px] font-bold text-ink">Redirecting to registration…</p>
      </CelebrationShell>
    );
  }

  return (
    <CelebrationShell>
      <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink">
        <Particles />
        <CircleCheck size={30} strokeWidth={2} className="celebration-icon-pop text-white" />
      </div>
      <p className="text-[18px] font-bold text-ink">Payment Successful</p>
      <p className="mt-1.5 text-[13px] text-muted leading-snug">
        Check your email ({email}) for your access code.
      </p>
      <p className="mt-3 text-[12px] font-semibold text-ink/70">
        Redirecting to signup in {countdown}s…
      </p>
    </CelebrationShell>
  );
}
