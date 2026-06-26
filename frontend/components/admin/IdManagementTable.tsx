'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { AccessCode } from '@/types/admin';

interface IdManagementTableProps {
  codes: AccessCode[];
  onDownloadAll: () => void;
  onDownloadUnused: () => void;
}

type StatusFilter = 'all' | 'active' | 'unused';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'unused', label: 'Unused' },
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
}: IdManagementTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar: search + status filter */}
      <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            size={12}
            strokeWidth={1.5}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by code or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-md bg-gray-50 w-56 focus:outline-none focus:ring-1 focus:ring-jade focus:border-jade placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5 ml-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1 text-[11px] font-semibold rounded transition-colors ${
                statusFilter === tab.key
                  ? 'bg-jade text-white'
                  : 'text-gray-500 hover:text-jade'
              }`}
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
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-[7px] text-left text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400">
                Access Code
              </th>
              <th className="px-4 py-[7px] text-left text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400">
                Student Name
              </th>
              <th className="px-4 py-[7px] text-left text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400">
                Status
              </th>
              <th className="px-4 py-[7px] text-left text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400">
                Activated
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-[12px] text-gray-400"
                >
                  No codes match your search.
                </td>
              </tr>
            ) : (
              filtered.map((code) => (
                <tr
                  key={code.id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-[#EAF3DE] transition-colors"
                >
                  <td className="px-4 py-[9px]">
                    <span className="font-mono font-bold text-[13px] tracking-wider text-ink">
                      {code.code}
                    </span>
                  </td>
                  <td className="px-4 py-[9px] text-[12px]">
                    {code.student_name ? (
                      <span className="text-ink font-medium">{code.student_name}</span>
                    ) : (
                      <span className="text-gray-400 italic">— Not yet used</span>
                    )}
                  </td>
                  <td className="px-4 py-[9px]">
                    {code.status === 'active' ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-jade text-white">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded border border-gray-300 text-gray-500">
                        Unused
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-[9px] text-[12px] text-gray-500">
                    {formatDate(code.activated_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400">
        Showing {filtered.length} of {codes.length} codes
      </div>
    </div>
  );
}
