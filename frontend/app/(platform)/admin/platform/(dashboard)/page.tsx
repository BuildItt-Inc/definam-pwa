'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Users,
  CreditCard,
  UserCheck,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  getSuperAdminOverview,
  type SuperAdminOverviewResponse,
  ApiError,
} from '@/lib/api/superAdmin';

export default function PlatformOverviewPage() {
  const [overview, setOverview] = useState<SuperAdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuperAdminOverview();
      setOverview(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to fetch platform metrics.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Could not connect to platform backend.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink text-bg-0">
              <ShieldAlert size={12} strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Platform Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1">
            System Overview
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Real-time infrastructure health, user activity, and monetization counters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/platform/admins"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <ShieldCheck size={14} />
            <span>Manage Admins</span>
          </Link>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-bg-2 text-ink shadow-xs transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-bg border border-danger/20 flex items-start gap-3 text-danger text-xs">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading overview</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Overview Content */}
      {overview && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Online Now */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] font-bold uppercase tracking-wider">Online Now</span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-ink mt-2">
                {overview.online_users}
              </div>
              <p className="text-[11px] text-success mt-1 font-medium">Active in the last 5 minutes</p>
            </div>

            {/* Total Users */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Accounts</span>
                <Users size={16} />
              </div>
              <div className="text-3xl font-extrabold text-ink mt-2">
                {overview.total_users}
              </div>
              <p className="text-[11px] text-muted mt-1">Platform-wide registered users</p>
            </div>

            {/* Signups Today */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] font-bold uppercase tracking-wider">Signups Today</span>
                <UserCheck size={16} className="text-ink" />
              </div>
              <div className="text-3xl font-extrabold text-ink mt-2">
                {overview.signups_today}
              </div>
              <p className="text-[11px] text-muted mt-1">New accounts since midnight UTC</p>
            </div>

            {/* Payments */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] font-bold uppercase tracking-wider">Processed Payments</span>
                <CreditCard size={16} />
              </div>
              <div className="text-3xl font-extrabold text-ink mt-2">
                {overview.processed_payments_count}
              </div>
              <p className="text-[11px] text-muted mt-1">Confirmed transactions</p>
            </div>
          </div>

          {/* Secondary Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User roles */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-ink">Users by Role</h2>
                  <p className="text-xs text-muted mt-0.5">Distribution across account types</p>
                </div>
                <Link
                  href="/admin/platform/users"
                  className="text-xs font-semibold text-muted hover:text-ink flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {Object.entries(overview.users_by_role).map(([role, count]) => {
                  const percent =
                    overview.total_users > 0
                      ? Math.round((count / overview.total_users) * 100)
                      : 0;
                  return (
                    <div key={role} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-ink">
                        <span className="capitalize">{role.replace(/_/g, ' ')}</span>
                        <span className="text-muted font-mono">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-bg-2 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-ink h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Access Codes Summary */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-ink">Access Codes</h2>
                  <p className="text-xs text-muted mt-0.5">Prepaid vouchers & school license pool</p>
                </div>
                <Link
                  href="/admin/platform/codes"
                  className="text-xs font-semibold text-muted hover:text-ink flex items-center gap-1 transition-colors"
                >
                  <span>Manage</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(overview.access_codes_summary).map(([status, count]) => (
                  <div
                    key={status}
                    className="p-3.5 rounded-xl border border-border bg-bg-0"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted">
                      {status}
                    </span>
                    <div className="text-2xl font-extrabold text-ink mt-1 font-mono">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Nav Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/admin/platform/admins"
              className="bg-card p-5 rounded-2xl border border-border hover:border-ink/30 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-bg-2 flex items-center justify-center text-ink">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">Admins & Invites</div>
                  <div className="text-[11px] text-muted">Add or remove super admins</div>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted group-hover:text-ink transition-colors" />
            </Link>

            <Link
              href="/admin/platform/funnel"
              className="bg-card p-5 rounded-2xl border border-border hover:border-ink/30 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-bg-2 flex items-center justify-center text-ink">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">Conversion Funnel</div>
                  <div className="text-[11px] text-muted">Cohort progression</div>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted group-hover:text-ink transition-colors" />
            </Link>

            <Link
              href="/admin/platform/audit"
              className="bg-card p-5 rounded-2xl border border-border hover:border-ink/30 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-bg-2 flex items-center justify-center text-ink">
                  <Activity size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">Audit Logs</div>
                  <div className="text-[11px] text-muted">Destructive actions ledger</div>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted group-hover:text-ink transition-colors" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
