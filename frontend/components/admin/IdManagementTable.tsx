'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import type { AccessCode } from '@/types/admin';

interface IdManagementTableProps {
  codes: AccessCode[];
  onDownloadAll: () => void;
  onDownloadUnused: () => void;
  onRevokeCode: (codeId: string) => Promise<void>;
  onReactivateCode: (codeId: string) => Promise<void>;
}

type StatusFilter = 'all' | 'active' | 'unused' | 'revoked';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'unused', label: 'Unused' },
  { key: 'revoked', label: 'Revoked' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function IdManagementTable({
  codes,
  onDownloadAll: _onDownloadAll,
  onDownloadUnused: _onDownloadUnused,
  onRevokeCode,
  onReactivateCode,
}: IdManagementTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [actioningIds, setActioningIds] = useState<Record<string, boolean>>({});

  const filtered = codes.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      q === '' ||
      c.code.toLowerCase().includes(q) ||
      (c.student_name?.toLowerCase().includes(q) ?? false);

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-bg-0 border border-border-2 rounded-[24px] overflow-hidden shadow-sm">
      {/* Toolbar: search + status filter */}
      <div className="px-6 py-4 border-b border-border-2 bg-bg-1/50 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by code or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-[12px] font-semibold border border-border-2 rounded-[16px] bg-bg-0 w-full focus:outline-none focus:border-ink transition-colors placeholder:text-muted placeholder:font-medium text-ink"
          />
        </div>

        <div className="flex items-center gap-1 bg-bg-1 border border-border-2 rounded-[16px] p-1 sm:ml-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-[12px] transition-colors ${ statusFilter === tab.key ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink' }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-bg-0 border-b border-border-2">
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                Access Code
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                Student Name
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                Status
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                Activated
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-[12px] font-medium text-muted"
                >
                  No codes match your search.
                </td>
              </tr>
            ) : (
              filtered.map((code, idx) => {
                const rowBg = idx % 2 === 0 ? 'bg-bg-0' : 'bg-bg-1/30';
                const isActioning = !!actioningIds[code.id];

                const handleAction = async () => {
                  setActioningIds((prev) => ({ ...prev, [code.id]: true }));
                  try {
                    if (code.status === 'revoked') {
                      await onReactivateCode(code.id);
                    } else {
                      await onRevokeCode(code.id);
                    }
                  } finally {
                    setActioningIds((prev) => ({ ...prev, [code.id]: false }));
                  }
                };

                return (
                  <motion.tr
                    variants={staggerItem}
                    key={code.id}
                    className={`border-b border-border-2 last:border-b-0 hover:bg-bg-1 transition-colors ${rowBg}`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-[14px] tracking-widest text-ink">
                        {code.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px]">
                      {code.student_name ? (
                        <span className="text-ink font-bold">{code.student_name}</span>
                      ) : (
                        <span className="text-muted font-medium italic">— Not yet used</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {code.status === 'active' ? (
                        <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold rounded-[16px] bg-bg-0 text-ink border border-border-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-success mr-2" />
                          Active
                        </span>
                      ) : code.status === 'revoked' ? (
                        <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold rounded-[16px] bg-bg-0 text-danger border border-border-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger mr-2" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold rounded-[16px] bg-bg-0 text-muted border border-border-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2" />
                          Unused
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[12px] font-medium text-muted">
                      {formatDate(code.activated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={handleAction}
                        disabled={isActioning}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                          code.status === 'revoked'
                            ? 'bg-transparent text-success border-success/30 hover:bg-success/5'
                            : 'bg-transparent text-danger border-danger/30 hover:bg-danger/5'
                        }`}
                      >
                        {isActioning
                          ? 'Processing...'
                          : code.status === 'revoked'
                          ? 'Reactivate'
                          : 'Revoke'}
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </motion.tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-bg-1/30 text-[11px] font-medium text-muted border-t border-border-2">
        Showing {filtered.length} of {codes.length} total codes
      </div>
    </div>
  );
}
