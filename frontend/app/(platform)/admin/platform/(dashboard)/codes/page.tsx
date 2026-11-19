'use client';

import { useEffect, useState } from 'react';
import {
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import {
  getSuperAdminCodes,
  generateAccessCodes,
  revokeAccessCode,
  reactivateAccessCode,
  type AccessCodeItem,
  ApiError,
} from '@/lib/api/superAdmin';
import { toast } from '@/lib/toast';

export default function PlatformCodesPage() {
  const [codes, setCodes] = useState<AccessCodeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk Generation modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genCount, setGenCount] = useState(20);
  const [genPrefix, setGenPrefix] = useState('BETA');
  const [genType, setGenType] = useState<'individual' | 'org'>('individual');
  const [genMonths, setGenMonths] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedBatch, setCopiedBatch] = useState(false);

  async function loadCodes() {
    setLoading(true);
    setError(null);
    try {
      const res = await getSuperAdminCodes({
        page,
        page_size: pageSize,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setCodes(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to fetch access codes.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Connection error while fetching codes.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, statusFilter]);

  async function handleToggleCodeStatus(code: AccessCodeItem) {
    try {
      if (code.status === 'revoked') {
        await reactivateAccessCode(code.id);
        toast.success('Code Reactivated', `Code ${code.code} is now active.`);
      } else {
        await revokeAccessCode(code.id);
        toast.info('Code Revoked', `Code ${code.code} has been revoked.`);
      }
      void loadCodes();
    } catch (err: unknown) {
      toast.error('Action failed', err instanceof Error ? err.message : 'Error updating code');
    }
  }

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await generateAccessCodes({
        count: genCount,
        prefix: genPrefix.toUpperCase(),
        type: genType,
        duration_months: genMonths,
      });
      setGeneratedCodes(res.codes);
      toast.success('Codes Generated', `Successfully created ${res.count} codes.`);
      void loadCodes();
    } catch (err: unknown) {
      toast.error('Generation Failed', err instanceof Error ? err.message : 'Error generating codes');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopyAllCodes() {
    void navigator.clipboard.writeText(generatedCodes.join('\n'));
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink text-bg-0">
              <KeyRound size={12} strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              License Pool
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1">
            Access Codes
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Generate and manage access vouchers for individual students and partner schools.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setGeneratedCodes([]);
              setShowGenModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-xl bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>Generate Codes</span>
          </button>
          <button
            type="button"
            onClick={() => void loadCodes()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-bg-2 text-ink shadow-xs transition-colors"
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
            <p className="font-bold">Error loading codes</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-bg-2/30">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search code string..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    void loadCodes();
                  }
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-card text-ink placeholder:text-faint focus:outline-none focus:border-ink font-mono uppercase"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 text-xs rounded-xl border border-border bg-card font-medium text-ink focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 text-xs rounded-xl border border-border bg-card font-medium text-ink focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="individual">Individual</option>
              <option value="org">School / Org</option>
            </select>
          </div>

          <div className="text-[11px] text-muted font-mono">
            Showing {codes.length} of {total} codes
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-2/50 text-muted uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Access Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Activated By</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-ink">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-bg-2/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-ink tracking-wider">
                    {c.code}
                  </td>
                  <td className="py-3.5 px-4 capitalize font-medium text-muted">
                    {c.type}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        c.status === 'active'
                          ? 'bg-success-bg text-success border border-success/20'
                          : c.status === 'pending'
                          ? 'bg-bg-2 text-ink border border-border'
                          : 'bg-danger-bg text-danger border border-danger/20'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                    {c.activated_by_username ? `@${c.activated_by_username}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => void handleToggleCodeStatus(c)}
                      className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                        c.status === 'revoked'
                          ? 'border-border text-ink hover:bg-bg-2'
                          : 'border-danger/30 text-danger hover:bg-danger-bg'
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
            disabled={codes.length < pageSize || page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-bg-2 text-ink disabled:opacity-40 transition-colors shadow-xs"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── MODAL: GENERATE CODES ───────────────────────────────────────── */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-ink">
              Bulk Generate Access Codes
            </h3>

            {generatedCodes.length === 0 ? (
              <form onSubmit={handleGenerateCodes} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    value={genPrefix}
                    onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl focus:outline-none uppercase font-mono bg-bg-0 text-ink"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={genCount}
                      onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl focus:outline-none bg-bg-0 text-ink font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                      Duration (Months)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={36}
                      value={genMonths}
                      onChange={(e) => setGenMonths(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs border border-border rounded-xl focus:outline-none bg-bg-0 text-ink font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Code Type
                  </label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value as 'individual' | 'org')}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl focus:outline-none bg-bg-0 text-ink"
                  >
                    <option value="individual">Individual Student</option>
                    <option value="org">School Organization</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border text-muted hover:bg-bg-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-ink text-bg-0 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : `Generate ${genCount} Codes`}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-success">
                    ✓ {generatedCodes.length} Codes Created
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAllCodes}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink"
                  >
                    {copiedBatch ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    <span>{copiedBatch ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto p-3 rounded-xl bg-bg-0 border border-border font-mono text-xs space-y-1">
                  {generatedCodes.map((code) => (
                    <div key={code} className="text-ink font-bold">
                      {code}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowGenModal(false);
                    setGeneratedCodes([]);
                  }}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-ink text-bg-0 hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
