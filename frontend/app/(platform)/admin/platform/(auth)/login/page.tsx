'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import RecallLogo from '@/components/ui/RecallLogo';
import { loginSuperAdmin, ApiError } from '@/lib/api/superAdmin';

function SuperAdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const destination =
    nextParam && nextParam.startsWith('/admin/platform') ? nextParam : '/admin/platform';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginSuperAdmin({ email, password });
      router.replace(destination);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Invalid email or password.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login.');
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
            <ShieldAlert size={12} />
            Platform Control
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              Super Admin Sign In
            </h1>
            <p className="text-xs text-muted mt-1">
              Authorized creators & platform administrators only.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger/20 flex items-start gap-2.5 text-danger text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@recallr.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg-0 text-ink placeholder:text-faint focus:outline-none focus:border-ink focus:bg-card transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Platform</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-faint font-mono">
          Strictly monitored • Unauthorized access attempts are recorded
        </p>
      </div>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-0 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      }
    >
      <SuperAdminLoginForm />
    </Suspense>
  );
}
