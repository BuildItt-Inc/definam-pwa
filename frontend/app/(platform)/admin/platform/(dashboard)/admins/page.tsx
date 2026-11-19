'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Mail,
  UserPlus,
  RefreshCw,
  Trash2,
  XCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  listSuperAdmins,
  listSuperAdminInvites,
  sendSuperAdminInvite,
  revokeSuperAdminInvite,
  clearRevokedSuperAdminInvites,
  clearAllSuperAdminInvites,
  removeSuperAdmin,
  type SuperAdminItem,
  type SuperAdminInviteItem,
  ApiError,
} from '@/lib/api/superAdmin';
import { toast } from '@/lib/toast';

export default function PlatformAdminsPage() {
  const [admins, setAdmins] = useState<SuperAdminItem[]>([]);
  const [invites, setInvites] = useState<SuperAdminInviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Remove confirmation modal
  const [adminToRemove, setAdminToRemove] = useState<SuperAdminItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isClearingRevoked, setIsClearingRevoked] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [adminsRes, invitesRes] = await Promise.all([
        listSuperAdmins(),
        listSuperAdminInvites(),
      ]);
      setAdmins(adminsRes.items);
      setInvites(invitesRes.items);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load administrator accounts.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error connecting to backend.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setIsSendingInvite(true);

    try {
      await sendSuperAdminInvite({ email: inviteEmail });
      toast.success('Invitation Sent', `Sent super admin invitation to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      void loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setInviteError(err.message || 'Failed to send invite.');
      } else if (err instanceof Error) {
        setInviteError(err.message);
      } else {
        setInviteError('An unexpected error occurred.');
      }
    } finally {
      setIsSendingInvite(false);
    }
  }

  async function handleRevokeInvite(invite: SuperAdminInviteItem) {
    try {
      await revokeSuperAdminInvite(invite.id);
      toast.info('Invite Revoked', `Revoked invitation for ${invite.email}`);
      void loadData();
    } catch (err: unknown) {
      toast.error(
        'Revocation Failed',
        err instanceof Error ? err.message : 'Could not revoke invite'
      );
    }
  }

  async function handleClearRevoked() {
    setIsClearingRevoked(true);
    try {
      const res = await clearRevokedSuperAdminInvites();
      toast.success(
        'Invites Cleared',
        `Removed ${res.deleted_count} inactive/revoked invite(s).`
      );
      void loadData();
    } catch (err: unknown) {
      toast.error(
        'Clear Failed',
        err instanceof Error ? err.message : 'Could not clear revoked invites'
      );
    } finally {
      setIsClearingRevoked(false);
    }
  }

  async function handleClearAllInvites() {
    if (!window.confirm('Clear all invite history? Active pending tokens will also be wiped.')) {
      return;
    }
    setIsClearingRevoked(true);
    try {
      const res = await clearAllSuperAdminInvites();
      toast.success(
        'History Cleared',
        `Cleared ${res.deleted_count} invitation record(s).`
      );
      void loadData();
    } catch (err: unknown) {
      toast.error(
        'Clear Failed',
        err instanceof Error ? err.message : 'Could not clear invite history'
      );
    } finally {
      setIsClearingRevoked(false);
    }
  }

  async function handleConfirmRemove() {
    if (!adminToRemove) return;
    setIsRemoving(true);

    try {
      await removeSuperAdmin(adminToRemove.id);
      toast.success(
        'Admin Removed',
        `Successfully removed super admin access for ${adminToRemove.email || adminToRemove.username}`
      );
      setAdminToRemove(null);
      void loadData();
    } catch (err: unknown) {
      toast.error(
        'Removal Failed',
        err instanceof Error ? err.message : 'Could not remove administrator'
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink text-bg-0">
              <ShieldCheck size={12} strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Access Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1">
            Platform Administrators
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage root access to Recall infrastructure and send email invitations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInviteEmail('');
              setInviteError(null);
              setShowInviteModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-xl bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <UserPlus size={14} />
            <span>Invite Super Admin</span>
          </button>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-bg-2 text-ink shadow-xs transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-bg border border-danger/20 flex items-start gap-3 text-danger text-xs">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading administrators</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── SECTION 1: ACTIVE SUPER ADMINS ──────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Active Super Admins</h2>
            <p className="text-xs text-muted mt-0.5">
              Accounts with unrestricted root access to the platform ({admins.length})
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-2/50 text-muted uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-ink">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-bg-2/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-ink flex items-center gap-2">
                      <Mail size={13} className="text-muted" />
                      <span>{admin.email || admin.username}</span>
                    </div>
                    {admin.name && (
                      <div className="text-[11px] text-muted pl-5 mt-0.5">
                        {admin.name}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-ink text-bg-0">
                      Super Admin
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-muted text-[11px]">
                    {admin.last_seen_at
                      ? new Date(admin.last_seen_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setAdminToRemove(admin)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger-bg transition-colors"
                      title="Remove super admin access"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 2: PENDING & RECENT INVITATIONS ──────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Invitation History</h2>
            <p className="text-xs text-muted mt-0.5">
              Pending, accepted, and revoked email invitations ({invites.length})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {invites.some((i) => i.status === 'revoked' || i.is_expired) && (
              <button
                type="button"
                disabled={isClearingRevoked}
                onClick={() => void handleClearRevoked()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-danger-bg hover:text-danger hover:border-danger/20 transition-all text-muted disabled:opacity-50"
                title="Permanently remove all revoked and expired invitations"
              >
                <Trash2 size={12} className={isClearingRevoked ? 'animate-spin' : ''} />
                <span>{isClearingRevoked ? 'Clearing...' : 'Clear Revoked'}</span>
              </button>
            )}
            {invites.length > 0 && (
              <button
                type="button"
                disabled={isClearingRevoked}
                onClick={() => void handleClearAllInvites()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-danger/30 text-danger hover:bg-danger-bg transition-all disabled:opacity-50"
                title="Wipe entire invite history log"
              >
                <Trash2 size={12} className={isClearingRevoked ? 'animate-spin' : ''} />
                <span>{isClearingRevoked ? 'Clearing...' : 'Clear All History'}</span>
              </button>
            )}
          </div>
        </div>

        {invites.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs">
            No invitation history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-2/50 text-muted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Invited Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Invited By</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4">Expires At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-ink">
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-bg-2/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-ink">
                      {inv.email}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-success-bg text-success border border-success/20">
                          <CheckCircle2 size={10} />
                          Accepted
                        </span>
                      ) : inv.status === 'pending' && !inv.is_expired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warn-bg text-warn border border-warn/20">
                          <Clock size={10} />
                          Pending
                        </span>
                      ) : inv.status === 'revoked' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-bg-2 text-muted">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-danger-bg text-danger border border-danger/20">
                          Expired
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted text-[11px]">
                      {inv.invited_by_username || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.status === 'pending' && !inv.is_expired && (
                        <button
                          type="button"
                          onClick={() => void handleRevokeInvite(inv)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-border hover:bg-danger-bg hover:text-danger text-muted transition-colors"
                        >
                          <XCircle size={12} />
                          <span>Revoke</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: INVITE SUPER ADMIN ───────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink text-bg-0">
                  <UserPlus size={13} />
                </span>
                <h3 className="text-base font-bold text-ink">
                  Invite Super Admin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-muted hover:text-ink text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted">
              Enter the colleague’s email address. An invitation link with a 48-hour expiration will be delivered via Resend.
            </p>

            {inviteError && (
              <div className="p-3 rounded-xl bg-danger-bg border border-danger/20 text-danger text-xs flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@recallr.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg-0 text-ink placeholder:text-faint focus:outline-none focus:border-ink focus:bg-card transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border text-muted hover:bg-bg-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite || !inviteEmail}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSendingInvite ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Sending Invite...</span>
                    </>
                  ) : (
                    <span>Send Invitation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM REMOVAL ───────────────────────────────────────── */}
      {adminToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-danger">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-bg">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">
                  Revoke Super Admin Access?
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Target: {adminToRemove.email || adminToRemove.username}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              This action will revoke root access and immediately invalidate all active sessions. If this user was originally promoted, their previous role will be restored; if created via invitation, the account will be deleted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdminToRemove(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border text-muted hover:bg-bg-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmRemove()}
                disabled={isRemoving}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-danger text-white hover:bg-danger/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRemoving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Confirm Removal</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
