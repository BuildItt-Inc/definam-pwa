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
  RotateCcw,
  BookOpen,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import {
  getSuperAdminOverview,
  getPlatformTraction,
  clearPlatformActivity,
  type SuperAdminOverviewResponse,
  type PlatformTractionResponse,
  ApiError,
} from '@/lib/api/superAdmin';
import { toast } from '@/lib/toast';

export default function PlatformOverviewPage() {
  const [overview, setOverview] = useState<SuperAdminOverviewResponse | null>(null);
  const [traction, setTraction] = useState<PlatformTractionResponse | null>(null);
  const [tractionPeriod, setTractionPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [tractionLoading, setTractionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear activity modal state
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [ovData, tracData] = await Promise.all([
        getSuperAdminOverview(),
        getPlatformTraction(tractionPeriod),
      ]);
      setOverview(ovData);
      setTraction(tracData);
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

  async function handlePeriodChange(p: 'weekly' | 'monthly' | 'yearly') {
    setTractionPeriod(p);
    setTractionLoading(true);
    try {
      const data = await getPlatformTraction(p);
      setTraction(data);
    } catch (err) {
      toast.error('Failed to load traction', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTractionLoading(false);
    }
  }

  async function handleClearActivity(e: React.FormEvent) {
    e.preventDefault();
    if (confirmationInput.trim() !== 'CLEAR ACTIVITY') {
      setClearError("Please type 'CLEAR ACTIVITY' exactly.");
      return;
    }

    setIsClearing(true);
    setClearError(null);
    try {
      const res = await clearPlatformActivity({
        confirmation: confirmationInput.trim(),
      });
      toast.success('Activity Reset', res.message);
      setShowClearModal(false);
      setConfirmationInput('');
      void loadData();
    } catch (err: unknown) {
      setClearError(err instanceof Error ? err.message : 'Failed to clear activity');
    } finally {
      setIsClearing(false);
    }
  }

  useEffect(() => {
    void loadData();
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
          <button
            type="button"
            onClick={() => {
              setConfirmationInput('');
              setClearError(null);
              setShowClearModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-danger/30 text-danger hover:bg-danger-bg transition-all shadow-xs"
          >
            <RotateCcw size={13} />
            <span>Clear Activity</span>
          </button>
          <Link
            href="/admin/platform/admins"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <ShieldCheck size={14} />
            <span>Manage Admins</span>
          </Link>
          <button
            type="button"
            onClick={() => void loadData()}
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

          {/* ── TRACTION METRICS (Weekly / Monthly / Yearly) ────────────── */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink text-bg-0">
                    <TrendingUp size={12} strokeWidth={2.5} />
                  </span>
                  <h2 className="text-sm font-bold text-ink">Platform Traction</h2>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Track multi-horizon adoption, study sessions, and retention across time.
                </p>
              </div>

              {/* Time Horizon Pills */}
              <div className="inline-flex items-center bg-bg-2 p-1 rounded-xl border border-border">
                {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => void handlePeriodChange(period)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      tractionPeriod === period
                        ? 'bg-card text-ink shadow-xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {tractionLoading ? (
              <div className="p-8 flex items-center justify-center text-muted text-xs gap-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>Recalculating traction metrics...</span>
              </div>
            ) : traction ? (
              <div className="space-y-6">
                {/* 5 Traction KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* New Signups */}
                  <div className="p-4 rounded-xl border border-border bg-bg-0 space-y-1">
                    <div className="flex items-center justify-between text-muted text-[10px] font-bold uppercase tracking-wider">
                      <span>Signups</span>
                      <Users size={13} />
                    </div>
                    <div className="text-2xl font-extrabold text-ink font-mono mt-1">
                      {traction.current.signups}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {(traction.percent_changes.signups ?? 0) >= 0 ? (
                        <span className="text-success inline-flex items-center">
                          <ArrowUpRight size={12} />
                          +{traction.percent_changes.signups}%
                        </span>
                      ) : (
                        <span className="text-danger inline-flex items-center">
                          <ArrowDownRight size={12} />
                          {traction.percent_changes.signups}%
                        </span>
                      )}
                      <span className="text-muted text-[10px]">vs prev</span>
                    </div>
                  </div>

                  {/* Active Users */}
                  <div className="p-4 rounded-xl border border-border bg-bg-0 space-y-1">
                    <div className="flex items-center justify-between text-muted text-[10px] font-bold uppercase tracking-wider">
                      <span>Active Users</span>
                      <Activity size={13} />
                    </div>
                    <div className="text-2xl font-extrabold text-ink font-mono mt-1">
                      {traction.current.active_users}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {(traction.percent_changes.active_users ?? 0) >= 0 ? (
                        <span className="text-success inline-flex items-center">
                          <ArrowUpRight size={12} />
                          +{traction.percent_changes.active_users}%
                        </span>
                      ) : (
                        <span className="text-danger inline-flex items-center">
                          <ArrowDownRight size={12} />
                          {traction.percent_changes.active_users}%
                        </span>
                      )}
                      <span className="text-muted text-[10px]">vs prev</span>
                    </div>
                  </div>

                  {/* Topics Reviewed */}
                  <div className="p-4 rounded-xl border border-border bg-bg-0 space-y-1">
                    <div className="flex items-center justify-between text-muted text-[10px] font-bold uppercase tracking-wider">
                      <span>Reviews Done</span>
                      <BookOpen size={13} />
                    </div>
                    <div className="text-2xl font-extrabold text-ink font-mono mt-1">
                      {traction.current.topics_reviewed}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {(traction.percent_changes.topics_reviewed ?? 0) >= 0 ? (
                        <span className="text-success inline-flex items-center">
                          <ArrowUpRight size={12} />
                          +{traction.percent_changes.topics_reviewed}%
                        </span>
                      ) : (
                        <span className="text-danger inline-flex items-center">
                          <ArrowDownRight size={12} />
                          {traction.percent_changes.topics_reviewed}%
                        </span>
                      )}
                      <span className="text-muted text-[10px]">vs prev</span>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 rounded-xl border border-border bg-bg-0 space-y-1">
                    <div className="flex items-center justify-between text-muted text-[10px] font-bold uppercase tracking-wider">
                      <span>Tutor Chats</span>
                      <MessageSquare size={13} />
                    </div>
                    <div className="text-2xl font-extrabold text-ink font-mono mt-1">
                      {traction.current.chat_messages}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {(traction.percent_changes.chat_messages ?? 0) >= 0 ? (
                        <span className="text-success inline-flex items-center">
                          <ArrowUpRight size={12} />
                          +{traction.percent_changes.chat_messages}%
                        </span>
                      ) : (
                        <span className="text-danger inline-flex items-center">
                          <ArrowDownRight size={12} />
                          {traction.percent_changes.chat_messages}%
                        </span>
                      )}
                      <span className="text-muted text-[10px]">vs prev</span>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="p-4 rounded-xl border border-border bg-bg-0 space-y-1 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between text-muted text-[10px] font-bold uppercase tracking-wider">
                      <span>Revenue</span>
                      <CreditCard size={13} />
                    </div>
                    <div className="text-2xl font-extrabold text-ink font-mono mt-1">
                      ₦{traction.current.revenue_naira.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {(traction.percent_changes.revenue_naira ?? 0) >= 0 ? (
                        <span className="text-success inline-flex items-center">
                          <ArrowUpRight size={12} />
                          +{traction.percent_changes.revenue_naira}%
                        </span>
                      ) : (
                        <span className="text-danger inline-flex items-center">
                          <ArrowDownRight size={12} />
                          {traction.percent_changes.revenue_naira}%
                        </span>
                      )}
                      <span className="text-muted text-[10px]">vs prev</span>
                    </div>
                  </div>
                </div>

                {/* Micro Histogram / Breakdown timeline */}
                <div className="p-4 rounded-xl border border-border bg-bg-0 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-ink">
                    <span>Activity Distribution ({tractionPeriod})</span>
                    <span className="text-muted text-[11px] font-normal">Active users & study reviews</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-12 gap-2 pt-2">
                    {traction.breakdown_labels.map((label, idx) => {
                      const bucket = traction.breakdown_data[idx];
                      const totalActivity = bucket ? bucket.topics_reviewed + bucket.active_users : 0;
                      return (
                        <div key={label} className="flex flex-col items-center gap-1">
                          <div className="h-16 w-full bg-bg-2 rounded-lg flex items-end p-1">
                            <div
                              className="w-full bg-ink rounded-md transition-all min-h-[4px]"
                              style={{
                                height: `${Math.min(100, Math.max(8, totalActivity * 12))}%`,
                              }}
                              title={`${label}: ${bucket?.active_users || 0} active, ${bucket?.topics_reviewed || 0} reviews`}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
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

      {/* ── MODAL: CLEAR PLATFORM ACTIVITY ────────────────────────────────── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl border border-danger/30 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-bg text-danger border border-danger/20">
                  <RotateCcw size={15} />
                </span>
                <h3 className="text-sm font-bold text-ink">Reset Platform Activity</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="text-muted hover:text-ink text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-muted space-y-2 leading-relaxed">
              <p>
                This action will wipe student study history, reviews, tutor chat messages, and daily activity logs so you can restart platform testing fresh.
              </p>
              <div className="p-3 rounded-xl bg-danger-bg text-danger border border-danger/20 text-[11px] font-medium space-y-1">
                <p className="font-bold">⚠️ Irreversible Action:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>User accounts and super admins are <strong>NOT deleted</strong></li>
                  <li>Schools and class structures are <strong>preserved</strong></li>
                  <li>Access codes and payment records remain <strong>intact</strong></li>
                  <li>Only learning, chat, and review logs are wiped</li>
                </ul>
              </div>
            </div>

            {clearError && (
              <div className="p-3 rounded-xl bg-danger-bg border border-danger/20 flex items-start gap-2 text-danger text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{clearError}</span>
              </div>
            )}

            <form onSubmit={handleClearActivity} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Type <span className="font-mono text-danger">CLEAR ACTIVITY</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder="CLEAR ACTIVITY"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg-0 text-ink placeholder:text-faint focus:outline-none focus:border-danger focus:bg-card transition-colors font-mono uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-bg-2 text-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClearing || confirmationInput.trim() !== 'CLEAR ACTIVITY'}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-danger text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Trash2 size={13} className={isClearing ? 'animate-spin' : ''} />
                  <span>{isClearing ? 'Resetting...' : 'Confirm Reset Activity'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
