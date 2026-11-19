'use client';

import { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getSuperAdminAuditLogs,
  type AuditLogItem,
  ApiError,
} from '@/lib/api/superAdmin';

const COMMON_ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'admin.invite', label: 'admin.invite' },
  { value: 'admin.revoke_invite', label: 'admin.revoke_invite' },
  { value: 'admin.remove', label: 'admin.remove' },
  { value: 'admin.accept_invite', label: 'admin.accept_invite' },
  { value: 'user.delete', label: 'user.delete' },
  { value: 'user.reset', label: 'user.reset' },
  { value: 'user.role_change', label: 'user.role_change' },
  { value: 'code.generate', label: 'code.generate' },
  { value: 'code.revoke', label: 'code.revoke' },
  { value: 'code.reactivate', label: 'code.reactivate' },
  { value: 'topic.approve', label: 'topic.approve' },
  { value: 'topic.publish', label: 'topic.publish' },
];

export default function PlatformAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expandable details state: set of log IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await getSuperAdminAuditLogs({
        page,
        page_size: pageSize,
        action: actionFilter || undefined,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to fetch audit log entries.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Connection error while fetching logs.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter]);

  function getActionBadge(action: string) {
    const isDestructive =
      action.includes('delete') ||
      action.includes('remove') ||
      action.includes('revoke');
    const isPromote =
      action.includes('invite') ||
      action.includes('role') ||
      action.includes('accept');

    if (isDestructive) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold uppercase bg-danger-bg text-danger border border-danger/20">
          {action}
        </span>
      );
    }
    if (isPromote) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold uppercase bg-ink text-bg-0">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold uppercase bg-bg-2 text-ink border border-border">
        {action}
      </span>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink text-bg-0">
              <ShieldAlert size={12} strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Security Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1">
            System Audit Log
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Immutable, append-only record of administrative actions, credential resets, and access modifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs()}
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
            <p className="font-bold">Error loading audit records</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-bg-2/30">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 text-xs rounded-xl border border-border bg-card font-medium text-ink focus:outline-none"
            >
              {COMMON_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-muted font-mono">
            Showing {logs.length} of {total} records
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-2/50 text-muted uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-ink">
              {logs.map((log) => {
                const isExpanded = expandedIds.has(log.id);
                return (
                  <tr key={log.id} className="hover:bg-bg-2/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-muted whitespace-nowrap">
                      {new Date(log.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4 font-bold text-ink whitespace-nowrap">
                      {log.actor_username || log.actor_user_id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted whitespace-nowrap">
                      <span className="text-ink font-semibold">{log.target_type}:</span>{' '}
                      {log.target_id || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted whitespace-nowrap">
                      {log.ip || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.details ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(log.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-ink transition-colors"
                        >
                          <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      ) : (
                        <span className="text-faint text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded Details Drawer */}
        {logs.some((l) => expandedIds.has(l.id)) && (
          <div className="p-4 border-t border-border bg-bg-2/20 space-y-3">
            {logs
              .filter((l) => expandedIds.has(l.id))
              .map((l) => (
                <div key={l.id} className="p-3 rounded-xl border border-border bg-card space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                    <span>Log {l.id} details</span>
                    <button
                      type="button"
                      onClick={() => toggleExpand(l.id)}
                      className="hover:text-ink"
                    >
                      Close ✕
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-bg-0 border border-border font-mono text-[11px] text-ink overflow-x-auto">
                    {JSON.stringify(l.details, null, 2)}
                  </pre>
                </div>
              ))}
          </div>
        )}

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
            disabled={logs.length < pageSize || page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-bg-2 text-ink disabled:opacity-40 transition-colors shadow-xs"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
