'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import {
  getSuperAdminUsers,
  resetSuperAdminUser,
  deleteSuperAdminUser,
  type SuperAdminUserItem,
  ApiError,
} from '@/lib/api/superAdmin';
import { toast } from '@/lib/toast';

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<SuperAdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [roleFilter, setRoleFilter] = useState('');
  const [onlineFilter, setOnlineFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Reset modal
  const [selectedUserForReset, setSelectedUserForReset] = useState<SuperAdminUserItem | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  // User Delete modal
  const [userToDelete, setUserToDelete] = useState<SuperAdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const isOnlineVal =
        onlineFilter === 'true' ? true : onlineFilter === 'false' ? false : undefined;
      const res = await getSuperAdminUsers({
        page,
        page_size: pageSize,
        role: roleFilter || undefined,
        is_online: isOnlineVal,
        search: search || undefined,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to fetch platform users.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Connection error while fetching users.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, onlineFilter]);

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

  async function handleDeleteUser(user: SuperAdminUserItem) {
    setIsDeleting(true);
    try {
      await deleteSuperAdminUser(user.id);
      toast.success('User Deleted', `Account @${user.username} was permanently deleted.`);
      setUserToDelete(null);
      void loadUsers();
    } catch (err: unknown) {
      toast.error('Deletion Failed', err instanceof Error ? err.message : 'Could not delete user');
    } finally {
      setIsDeleting(false);
    }
  }

  function copyTempPassword(pw: string) {
    void navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink text-bg-0">
              <Users size={12} strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Platform Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1">
            Users & Active Sessions
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Search across individual students, school cohorts, and manage user sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers()}
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
            <p className="font-bold">Error loading users</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-bg-2/30">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search username, email, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    void loadUsers();
                  }
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-card text-ink placeholder:text-faint focus:outline-none focus:border-ink"
              />
            </div>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 text-xs rounded-xl border border-border bg-card font-medium text-ink focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="student_individual">Individual Student</option>
              <option value="student_org">School Student</option>
              <option value="admin">School Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>

            {/* Online filter */}
            <select
              value={onlineFilter}
              onChange={(e) => {
                setOnlineFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 text-xs rounded-xl border border-border bg-card font-medium text-ink focus:outline-none"
            >
              <option value="">All Presences</option>
              <option value="true">Online Now</option>
              <option value="false">Offline</option>
            </select>
          </div>

          <div className="text-[11px] text-muted font-mono">
            Showing {users.length} of {total} accounts
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-2/50 text-muted uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">School</th>
                <th className="py-3 px-4">Presence</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-ink">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-bg-2/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-ink">@{u.username}</div>
                    <div className="text-muted text-[11px] font-mono">
                      {u.email || u.name || '—'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-bg-2 text-ink border border-border">
                      {u.role.replace('student_', '')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted font-medium">
                    {u.school_name || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.is_online ? (
                      <span className="inline-flex items-center gap-1.5 text-success font-bold text-[11px]">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        Online Now
                      </span>
                    ) : (
                      <span className="text-muted text-[11px]">
                        {u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : 'Never'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForReset(u);
                          setTempPassword(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-bg-2 text-ink transition-colors shadow-xs"
                      >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                      </button>
                      {u.role !== 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger-bg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted bg-bg-2/30">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-bg-2 text-ink disabled:opacity-40 transition-colors shadow-xs"
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>
          <span className="font-mono text-[11px]">
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          <button
            type="button"
            disabled={users.length < pageSize || page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-bg-2 text-ink disabled:opacity-40 transition-colors shadow-xs"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── MODAL: RESET USER ────────────────────────────────────────────── */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-ink">
              Reset Session & Credentials
            </h3>
            <p className="text-xs text-muted">
              Target user: <span className="font-mono text-ink font-bold">@{selectedUserForReset.username}</span>
            </p>

            {tempPassword ? (
              <div className="space-y-3 p-4 rounded-xl bg-bg-0 border border-border">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  New Temporary Password
                </span>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-card border border-border font-mono text-sm font-bold text-ink">
                  <span>{tempPassword}</span>
                  <button
                    type="button"
                    onClick={() => copyTempPassword(tempPassword)}
                    className="p-1.5 rounded-md hover:bg-bg-2 text-muted hover:text-ink transition-colors"
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-muted">
                  Share this password with the user. They will be forced to change it on their next login.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
                  className="w-full mt-2 py-2 px-3 text-xs font-bold rounded-xl bg-ink text-bg-0 hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted leading-relaxed">
                  This will invalidate all existing JWT refresh tokens, clear active device fingerprints, and generate a new temporary password.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForReset(null)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border text-muted hover:bg-bg-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResetUser(selectedUserForReset)}
                    disabled={isResetting}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isResetting ? 'Resetting...' : 'Execute Reset'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE USER ────────────────────────────────────────────── */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-danger">
              Permanently Delete Account?
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-ink">@{userToDelete.username}</span>? This action is irrevocable and cascades across study histories and session data.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border text-muted hover:bg-bg-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteUser(userToDelete)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-danger text-white hover:bg-danger/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
