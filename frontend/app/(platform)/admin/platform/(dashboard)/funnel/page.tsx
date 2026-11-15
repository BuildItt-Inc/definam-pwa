'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  getSuperAdminFunnel,
  type FunnelStepItem,
  ApiError,
} from '@/lib/api/superAdmin';

export default function PlatformFunnelPage() {
  const [funnel, setFunnel] = useState<FunnelStepItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadFunnel() {
    setLoading(true);
    setError(null);
    try {
      const res = await getSuperAdminFunnel();
      setFunnel(res.funnel);
      setTotalStudents(res.total_students);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load funnel analytics.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error connecting to backend analytics.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFunnel();
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink text-bg-0">
              <TrendingUp size={12} strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Engagement Metrics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1">
            Conversion Funnel
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Cohort progression from signup to habitual daily recall practice.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadFunnel()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-bg-2 text-ink shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-bg border border-danger/20 flex items-start gap-3 text-danger text-xs">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading funnel</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Total Students Metric Card */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-bg-2 flex items-center justify-center text-ink">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted">
              Active Student Base
            </div>
            <div className="text-2xl font-extrabold text-ink font-mono mt-0.5">
              {totalStudents} Learners
            </div>
          </div>
        </div>
        <p className="text-xs text-muted max-w-sm text-right hidden sm:block">
          Baseline cohort evaluated across initial diagnostics, lesson completions, and retention reviews.
        </p>
      </div>

      {/* Steps List */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-ink">Activation Sequence</h2>

        <div className="space-y-4">
          {funnel.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-xl border border-border bg-bg-0 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink text-bg-0 text-xs font-mono font-bold">
                    {step.step}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-ink">{step.name}</h3>
                    <p className="text-[11px] text-muted">{step.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-ink font-mono">
                    {step.count}
                  </div>
                  <div className="text-[11px] text-success font-semibold">
                    {step.conversion_from_first}% overall
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-bg-2 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-ink h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, step.conversion_from_first)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
