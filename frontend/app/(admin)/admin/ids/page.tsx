'use client';

import { useEffect, useState } from 'react';
import { Building2, Download } from 'lucide-react';
import { getAccessCodes, downloadCodes } from '@/lib/api/admin';
import { IdManagementTable } from '@/components/admin/IdManagementTable';
import type { AccessCodesData } from '@/types/admin';

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-[10px] flex items-center animate-pulse">
        <div className="h-4 w-44 bg-gray-200 rounded" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-4">
        {/* Subscription banner */}
        <SkeletonBlock className="h-[52px] w-full" />

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
        </div>

        {/* Download buttons */}
        <div className="flex gap-3">
          <SkeletonBlock className="h-9 w-36" />
          <SkeletonBlock className="h-9 w-40" />
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <div className="h-7 w-52 bg-gray-200 rounded-md" />
            <div className="ml-auto h-7 w-32 bg-gray-100 rounded-md" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-[9px] border-b border-gray-100 last:border-b-0">
              <div className="h-4 bg-gray-100 rounded" style={{ width: i % 3 === 0 ? '80%' : '60%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminIdsPage() {
  const [data, setData] = useState<AccessCodesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingUnused, setDownloadingUnused] = useState(false);

  useEffect(() => {
    getAccessCodes()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load access codes'),
      );
  }, []);

  async function handleDownloadAll() {
    setDownloadingAll(true);
    try {
      await downloadCodes('all');
    } finally {
      setDownloadingAll(false);
    }
  }

  async function handleDownloadUnused() {
    setDownloadingUnused(true);
    try {
      await downloadCodes('unused');
    } finally {
      setDownloadingUnused(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <p className="text-[13px] text-coral font-semibold">{error}</p>
      </div>
    );
  }

  if (!data) return <LoadingSkeleton />;

  const { subscription, stats, codes } = data;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-[10px] flex items-center shrink-0">
        <h1 className="font-syne text-[14px] font-extrabold text-ink leading-tight tracking-tight">
          Access ID Management
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-4">

        {/* Subscription banner */}
        <div
          className="flex items-center gap-3 bg-[#EAF3DE] border border-[#9FE1CB] rounded-lg px-4 py-3"
          style={{ borderLeft: '3px solid #1B6B4A' }}
        >
          <Building2 size={18} strokeWidth={1.5} className="text-jade shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-jade leading-tight">
              {subscription.term} Subscription Active
            </p>
            <p className="text-[11px] text-jade/70 mt-0.5">
              {subscription.total_seats.toLocaleString()} seats purchased · Expires{' '}
              {subscription.expires_at}
            </p>
          </div>
        </div>

        {/* 3 Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total IDs — neutral */}
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
            <div className="text-[26px] font-black text-ink leading-none tracking-tight">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 mt-2">Total IDs</div>
          </div>

          {/* Activated — jade tint */}
          <div className="bg-[#EAF3DE] border border-[#9FE1CB] rounded-lg p-4">
            <div className="text-[26px] font-black text-jade leading-none tracking-tight">
              {stats.activated.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 mt-2">Activated</div>
          </div>

          {/* Unused — gold tint */}
          <div className="bg-[#FEF3C7] border border-[#E5C97A] rounded-lg p-4">
            <div className="text-[26px] font-black text-gold leading-none tracking-tight">
              {stats.unused.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 mt-2">Unused</div>
          </div>
        </div>

        {/* Download buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="flex items-center gap-2 px-4 py-2 bg-jade text-white text-[11px] font-bold rounded-lg hover:bg-jade/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={13} strokeWidth={1.5} />
            {downloadingAll ? 'Downloading...' : 'Download All IDs'}
          </button>

          <button
            onClick={handleDownloadUnused}
            disabled={downloadingUnused}
            className="flex items-center gap-2 px-4 py-2 bg-transparent text-jade text-[11px] font-bold rounded-lg border-[1.5px] border-jade hover:bg-jade/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={13} strokeWidth={1.5} />
            {downloadingUnused ? 'Downloading...' : 'Download Unused Only'}
          </button>
        </div>

        {/* Access codes table */}
        <IdManagementTable
          codes={codes}
          onDownloadAll={handleDownloadAll}
          onDownloadUnused={handleDownloadUnused}
        />
      </div>
    </div>
  );
}
