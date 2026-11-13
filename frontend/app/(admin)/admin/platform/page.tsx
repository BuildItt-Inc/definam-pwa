'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/auth';
import {
  Activity,
  Users,
  KeyRound,
  CreditCard,
  UserCheck,
  TrendingUp,
  RotateCcw,
  Search,
  Check,
  Copy,
  Plus,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
} from 'lucide-react';
import {
  getSuperAdminOverview,
  getSuperAdminUsers,
  getSuperAdminFunnel,
  getSuperAdminCodes,
  generateAccessCodes,
  revokeAccessCode,
  reactivateAccessCode,
  resetSuperAdminUser,
  deleteSuperAdminUser,
  type SuperAdminOverviewResponse,
  type SuperAdminUserItem,
  type FunnelStepItem,
  type AccessCodeItem,
} from '@/lib/api/superAdmin';
import { toast } from '@/lib/toast';

type ActiveTab = 'overview' | 'users' | 'codes' | 'funnel';

export default function SuperAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overview data
  const [overview, setOverview] = useState<SuperAdminOverviewResponse | null>(null);

  // Users data
  const [users, setUsers] = useState<SuperAdminUserItem[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userOnlineFilter, setUserOnlineFilter] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [usersLoading, setUsersLoading] = useState(false);

  // User Reset modal
  const [selectedUserForReset, setSelectedUserForReset] = useState<SuperAdminUserItem | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SuperAdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Codes data
  const [codes, setCodes] = useState<AccessCodeItem[]>([]);
  const [codeTotal, setCodeTotal] = useState(0);
  const [codePage, setCodePage] = useState(1);
  const [codeTypeFilter, setCodeTypeFilter] = useState<string>('');
  const [codeStatusFilter, setCodeStatusFilter] = useState<string>('');
  const [codeSearch, setCodeSearch] = useState<string>('');
  const [codesLoading, setCodesLoading] = useState(false);

  // Code Generation modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genCount, setGenCount] = useState(20);
  const [genPrefix, setGenPrefix] = useState('BETA');
  const [genType, setGenType] = useState<'individual' | 'org'>('individual');
  const [genMonths, setGenMonths] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Funnel data
  const [funnel, setFunnel] = useState<FunnelStepItem[]>([]);
  const [funnelTotalStudents, setFunnelTotalStudents] = useState(0);

  // Load Overview
  async function loadOverview() {
    try {
      setError(null);
      const data = await getSuperAdminOverview();
      setOverview(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace('/admin/login?hint=not_admin');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load super admin overview');
    } finally {
      setLoading(false);
    }
  }

  // Load Users
  async function loadUsers() {
    setUsersLoading(true);
    try {
      const isOnlineVal = userOnlineFilter === 'true' ? true : userOnlineFilter === 'false' ? false : undefined;
      const res = await getSuperAdminUsers({
        page: userPage,
        page_size: 15,
        role: userRoleFilter || undefined,
        is_online: isOnlineVal,
        search: userSearch || undefined,
      });
      setUsers(res.items);
      setUserTotal(res.total);
    } catch (err: unknown) {
      toast.error('Failed to load users', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUsersLoading(false);
    }
  }

  // Load Codes
  async function loadCodes() {
    setCodesLoading(true);
    try {
      const res = await getSuperAdminCodes({
        page: codePage,
        page_size: 15,
        type: codeTypeFilter || undefined,
        status: codeStatusFilter || undefined,
        search: codeSearch || undefined,
      });
      setCodes(res.items);
      setCodeTotal(res.total);
    } catch (err: unknown) {
      toast.error('Failed to load access codes', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCodesLoading(false);
    }
  }

  // Load Funnel
  async function loadFunnel() {
    try {
      const res = await getSuperAdminFunnel();
      setFunnel(res.funnel);
      setFunnelTotalStudents(res.total_students);
    } catch (err: unknown) {
      toast.error('Failed to load funnel', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') void loadUsers();
    if (activeTab === 'codes') void loadCodes();
    if (activeTab === 'funnel') void loadFunnel();
  }, [activeTab, userPage, userRoleFilter, userOnlineFilter, codePage, codeTypeFilter, codeStatusFilter]);

  async function handleDeleteUser(user: SuperAdminUserItem) {
    setIsDeleting(true);
    try {
      await deleteSuperAdminUser(user.id);
      toast.success('User Deleted', `Account @${user.username} was permanently deleted.`);
      setUserToDelete(null);
      void loadUsers();
      if (overview) void loadOverview();
    } catch (err: unknown) {
      toast.error('Deletion Failed', err instanceof Error ? err.message : 'Could not delete user');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleResetUser(user: SuperAdminUserItem) {
    setIsResetting(true);
    try {
      const res = await resetSuperAdminUser(user.id, {
        reset_session: true,
        clear_device_fingerprint: true,
        force_password_change: true,
      });
      setTempPassword(res.temporary_password || 'Session reset successfully.');
      toast.success('User Reset Complete', 'Sessions invalidated and credentials reset.');
      void loadUsers();
    } catch (err: unknown) {
      toast.error('Reset Failed', err instanceof Error ? err.message : 'Error resetting user');
    } finally {
      setIsResetting(false);
    }
  }

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await generateAccessCodes({
        count: genCount,
        prefix: genPrefix,
        type: genType,
        duration_months: genMonths,
      });
      setGeneratedCodes(res.codes);
      toast.success('Codes Generated', `Successfully generated ${res.count} access codes.`);
      void loadCodes();
      if (overview) void loadOverview();
    } catch (err: unknown) {
      toast.error('Generation Failed', err instanceof Error ? err.message : 'Error generating codes');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleToggleCodeStatus(code: AccessCodeItem) {
    try {
      if (code.status === 'revoked') {
        await reactivateAccessCode(code.id);
        toast.success('Reactivated', `Code ${code.code} is now active.`);
      } else {
        await revokeAccessCode(code.id);
        toast.info('Revoked', `Code ${code.code} has been revoked.`);
      }
      void loadCodes();
      void loadOverview();
    } catch (err: unknown) {
      toast.error('Action failed', err instanceof Error ? err.message : 'Error updating code');
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
              <ShieldAlert size={14} strokeWidth={2.5} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Platform Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mt-1">
            Super Admin Console
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time platform metrics, user access management, and beta test controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadOverview();
            if (activeTab === 'users') void loadUsers();
            if (activeTab === 'codes') void loadCodes();
            if (activeTab === 'funnel') void loadFunnel();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading || usersLoading || codesLoading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Live Overview', icon: Activity },
          { id: 'users', label: 'Users & Sessions', icon: Users },
          { id: 'codes', label: 'Access Codes', icon: KeyRound },
          { id: 'funnel', label: 'Conversion Funnel', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-bold">Error loading console</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Online Now */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Online Now</span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mt-2">
                {overview.online_users}
              </div>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Active in the last 5 minutes</p>
            </div>

            {/* Total Users */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
                <Users size={16} />
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mt-2">
                {overview.total_users}
              </div>
              <p className="text-xs text-gray-500 mt-1">Platform-wide registered users</p>
            </div>

            {/* Signups Today */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Signups Today</span>
                <UserCheck size={16} className="text-brand" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mt-2">
                {overview.signups_today}
              </div>
              <p className="text-xs text-gray-500 mt-1">New accounts since midnight UTC</p>
            </div>

            {/* Payments */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Processed Payments</span>
                <CreditCard size={16} />
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mt-2">
                {overview.processed_payments_count}
              </div>
              <p className="text-xs text-gray-500 mt-1">Paystack webhooks confirmed</p>
            </div>
          </div>

          {/* Secondary breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User roles */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-gray-900">Users by Role</h2>
              <div className="space-y-2.5">
                {Object.entries(overview.users_by_role).map(([role, count]) => {
                  const percent = overview.total_users > 0 ? Math.round((count / overview.total_users) * 100) : 0;
                  return (
                    <div key={role} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span className="capitalize">{role.replace('_', ' ')}</span>
                        <span>{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gray-900 h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Access codes summary */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Access Codes Status</h2>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('codes');
                    setShowGenModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
                >
                  <Plus size={13} /> Generate Codes
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(overview.access_codes_summary).map(([status, count]) => (
                  <div key={status} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                      {status}
                    </span>
                    <div className="text-xl font-extrabold text-gray-900 mt-1">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: USERS & SESSIONS ──────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search username, email, name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setUserPage(1);
                      void loadUsers();
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                className="py-2 px-3 text-xs rounded-lg border border-gray-300 bg-white font-medium text-gray-700 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="student_individual">Individual Student</option>
                <option value="student_org">School Student</option>
                <option value="admin">School Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>

              {/* Online filter */}
              <select
                value={userOnlineFilter}
                onChange={(e) => {
                  setUserOnlineFilter(e.target.value);
                  setUserPage(1);
                }}
                className="py-2 px-3 text-xs rounded-lg border border-gray-300 bg-white font-medium text-gray-700 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="true">Online Now</option>
                <option value="false">Offline</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing {users.length} of {userTotal} users
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">School</th>
                  <th className="py-3 px-4">Presence</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{u.username}</div>
                      <div className="text-gray-400 text-[11px]">{u.email || u.name || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-gray-100 text-gray-700">
                        {u.role.replace('student_', '')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {u.school_name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {u.is_online ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          {u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : 'Never'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForReset(u);
                          setTempPassword(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors"
                      >
                        <RotateCcw size={12} /> Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50/40">
            <button
              type="button"
              disabled={userPage <= 1}
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span>Page {userPage}</span>
            <button
              type="button"
              disabled={users.length < 15}
              onClick={() => setUserPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 3: ACCESS CODES ─────────────────────────────────────────── */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search code..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCodePage(1);
                    void loadCodes();
                  }
                }}
                className="py-2 px-3 text-xs rounded-lg border border-gray-300 bg-white font-medium text-gray-700 focus:outline-none"
              />

              <select
                value={codeStatusFilter}
                onChange={(e) => {
                  setCodeStatusFilter(e.target.value);
                  setCodePage(1);
                }}
                className="py-2 px-3 text-xs rounded-lg border border-gray-300 bg-white font-medium text-gray-700 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>

              <select
                value={codeTypeFilter}
                onChange={(e) => {
                  setCodeTypeFilter(e.target.value);
                  setCodePage(1);
                }}
                className="py-2 px-3 text-xs rounded-lg border border-gray-300 bg-white font-medium text-gray-700 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="individual">Individual</option>
                <option value="org">School / Org</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setGeneratedCodes([]);
                setShowGenModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gray-900 text-white hover:bg-black shadow-xs transition-colors"
            >
              <Plus size={14} /> Bulk Generate Codes
            </button>
          </div>

          {/* Codes Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Activated By</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {codes.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 tracking-wider">
                        {c.code}
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-gray-600">
                        {c.type}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase ${
                            c.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'pending'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {c.activated_by_username || '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => void handleToggleCodeStatus(c)}
                          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                            c.status === 'revoked'
                              ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : 'border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {c.status === 'revoked' ? 'Reactivate' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50/40">
              <button
                type="button"
                disabled={codePage <= 1}
                onClick={() => setCodePage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span>Page {codePage}</span>
              <button
                type="button"
                disabled={codes.length < 15}
                onClick={() => setCodePage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: CONVERSION FUNNEL ──────────────────────────────────────── */}
      {activeTab === 'funnel' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Student Activation Funnel</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Cohort progression from signup to habitual daily learning.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-gray-400">Total Students</span>
              <div className="text-2xl font-extrabold text-gray-900">{funnelTotalStudents}</div>
            </div>
          </div>

          <div className="space-y-4">
            {funnel.map((step, idx) => (
              <div key={step.step} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold">
                      {step.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{step.name}</h3>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-gray-900">{step.count} students</div>
                    <div className="text-xs text-emerald-600 font-semibold">
                      {step.conversion_from_first}% overall
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, step.conversion_from_first)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: GENERATE CODES ───────────────────────────────────────── */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Bulk Generate Access Codes</h3>

            {generatedCodes.length === 0 ? (
              <form onSubmit={handleGenerateCodes} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={genPrefix}
                    onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none uppercase"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Count</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={genCount}
                      onChange={(e) => setGenCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Duration (Months)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={genMonths}
                      onChange={(e) => setGenMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating…' : 'Generate Now'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-emerald-700 font-medium">
                  ✓ Successfully generated {generatedCodes.length} codes:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200 font-mono text-xs">
                  {generatedCodes.map((code, idx) => (
                    <div key={code} className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                      <span>{code}</span>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(code);
                          setCopiedCodeIndex(idx);
                          setTimeout(() => setCopiedCodeIndex(null), 1500);
                        }}
                        className="text-gray-400 hover:text-gray-900"
                      >
                        {copiedCodeIndex === idx ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(generatedCodes.join('\n'));
                      toast.success('Copied', 'All generated codes copied to clipboard.');
                    }}
                    className="text-xs font-bold text-gray-900 underline"
                  >
                    Copy All Codes
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-black"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE USER ──────────────────────────────────────────── */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <span className="p-2 rounded-xl bg-red-100">
                <Trash2 size={18} />
              </span>
              <h3 className="text-base font-bold text-gray-900">Delete User Account</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>@{userToDelete.username}</strong> ({userToDelete.name || userToDelete.role})?
            </p>
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11.5px] text-red-800 font-medium">
              ⚠️ Warning: This will permanently remove their learning history, reviews, and active sessions. This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDeleteUser(userToDelete)}
                className="px-3.5 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: USER RESET ───────────────────────────────────────────── */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Emergency Reset</h3>
            <p className="text-xs text-gray-500">
              Reset active sessions and credentials for <strong>{selectedUserForReset.username}</strong>.
            </p>

            {tempPassword ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Temporary Password</span>
                <div className="font-mono text-sm font-bold text-emerald-950 select-all">
                  {tempPassword}
                </div>
                <p className="text-[11px] text-emerald-700">The user must change this on next login.</p>
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                This will immediately revoke their refresh tokens, clear single-session lock, and generate a temporary password.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForReset(null)}
                className="px-3.5 py-2 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              {!tempPassword && (
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => void handleResetUser(selectedUserForReset)}
                  className="px-3.5 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isResetting ? 'Resetting…' : 'Confirm Reset'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
