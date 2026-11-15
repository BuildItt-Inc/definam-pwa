'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import RecallLogo from '@/components/ui/RecallLogo';
import { acceptSuperAdminInvite, ApiError } from '@/lib/api/superAdmin';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invite token is missing from the URL. Please use the exact link from your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await acceptSuperAdminInvite({ token, password });
      setSuccess(true);
      setTimeout(() => {
        router.replace('/admin/platform');
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Invalid or expired invite token.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to accept invite. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-0 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <RecallLogo size={32} />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink text-bg-0 text-[10px] font-mono font-bold uppercase tracking-wider">
            <ShieldCheck size={12} />
            Platform Invitation
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              Join as Super Admin
            </h1>
            <p className="text-xs text-muted mt-1">
              Set your administrator password to activate your access.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
          {success ? (
            <div className="p-4 rounded-xl bg-success-bg border border-success/20 flex flex-col items-center text-center gap-2 text-success">
              <CheckCircle2 size={28} />
              <div className="font-bold text-sm">Account Activated!</div>
              <p className="text-xs text-muted">
                Redirecting to Platform Control console...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-xl bg-danger-bg border border-danger/20 flex items-start gap-2.5 text-danger text-xs">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-border bg-bg-0 text-ink placeholder:text-faint focus:outline-none focus:border-ink focus:bg-card transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg-0 text-ink placeholder:text-faint focus:outline-none focus:border-ink focus:bg-card transition-colors font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <span>Activate Super Admin Access</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-faint font-mono">
          Tokens expire in 48 hours • Invite single-use only
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-0 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
