'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, AlertTriangle } from 'lucide-react';
import { getAdminDashboard } from '@/lib/api/admin';
import { ClassTable } from '@/components/admin/ClassTable';
import type { AdminDashboardData } from '@/types/admin';

// ── Skeleton components ────────────────────────────────────────────────────

function SkeletonStatCard() {
  return (
    <div className="bg-card border border-border-2 rounded-lg p-4 animate-pulse">
      <div className="h-7 w-12 bg-bg-3 rounded mb-2" />
      <div className="h-2.5 w-24 bg-bg-2 rounded mb-2" />
      <div className="h-2.5 w-20 bg-bg-2 rounded" />
    </div>
  );
}

function SkeletonAlertBar() {
  return (
    <div className="h-10 w-full bg-amber-50 border border-amber-100 rounded-lg animate-pulse mb-4" />
  );
}

function SkeletonTableRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-[9px]">
          <div className="h-3 bg-bg-2 rounded" style={{ width: i === 0 ? '120px' : '60px' }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-card border border-border-2 rounded-lg overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-[10px] border-b border-border-2">
        <div className="h-4 w-40 bg-bg-3 rounded" />
        <div className="ml-auto flex gap-2">
          <div className="h-7 w-36 bg-bg-2 rounded-md" />
          <div className="h-7 w-28 bg-bg-2 rounded-md" />
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-0 border-b border-border-2">
            {['Student', 'Streak', 'Recall Status', 'Avg Accuracy', 'Weakest Topic', 'Last Active', ''].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-muted"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  number: string | number;
  label: string;
  delta: string;
  deltaClass?: string;
  topBorderColor: string;
}

function StatCard({ number, label, delta, deltaClass = 'text-muted', topBorderColor }: StatCardProps) {
  return (
    <div
      className="bg-card border border-border-2 rounded-lg p-4"
      style={{ borderTop: `3px solid ${topBorderColor}` }}
    >
      <div className="text-[22px] font-black text-ink leading-none tracking-tight">
        {number}
      </div>
      <div className="text-[10px] text-muted mt-1">{label}</div>
      <div className={`text-[10px] font-bold mt-1 ${deltaClass}`}>{delta}</div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminHomePage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load dashboard'),
      )
      .finally(() => setLoading(false));
  }, []);

  function handleViewStudent(studentId: string) {
    router.push(`/admin/students/${studentId}`);
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <p className="text-[13px] text-danger font-semibold">{error}</p>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div className="flex flex-col h-full">
        {/* Top bar skeleton */}
        <div className="bg-card border-b border-border-2 px-5 py-[10px] flex items-center gap-3 animate-pulse">
          <div>
            <div className="h-4 w-32 bg-bg-3 rounded mb-1.5" />
            <div className="h-2.5 w-48 bg-bg-2 rounded" />
          </div>
          <div className="ml-auto h-8 w-28 bg-bg-2 rounded-md" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-5 bg-bg-0 overflow-y-auto">
          {/* Stat cards skeleton */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <SkeletonAlertBar />
          <SkeletonTable />
        </div>
      </div>
    );
  }

  // ── Accuracy delta display ─────────────────────────────────────────────
  const accuracyDeltaText =
    data.accuracy_delta < 0
      ? `↓ ${Math.abs(data.accuracy_delta)}% from last week`
      : `↑ ${data.accuracy_delta}% from last week`;
  const accuracyDeltaClass = data.accuracy_delta < 0 ? 'text-danger' : 'text-success';

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-card border-b border-border-2 px-5 py-[10px] flex items-center gap-3 shrink-0">
        <div>
          <h1 className="font-bold text-[14px] font-extrabold text-ink leading-tight tracking-tight">
            Class Overview
          </h1>
          <p className="text-[10px] text-muted mt-0.5">
            {data.class_name} · {data.total_students} Students · Updated just now
          </p>
        </div>
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 text-[11px] font-bold border border-border-2 bg-card text-ink rounded-md px-3 py-[5px] hover:border-ink transition-colors">
            <Download size={13} strokeWidth={1.5} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 bg-bg-0">
        {/* 4 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard
            number={data.total_students}
            label="Total Students"
            delta={`↑ ${data.active_this_week} active this week`}
            deltaClass="text-muted"
            topBorderColor="#1B6B4A"
          />
          <StatCard
            number={`${data.class_avg_accuracy}%`}
            label="Class Avg Accuracy"
            delta={accuracyDeltaText}
            deltaClass={accuracyDeltaClass}
            topBorderColor="#C8973A"
          />
          <StatCard
            number={data.recall_overdue}
            label="Recall Overdue"
            delta="Students skipping"
            deltaClass="text-muted"
            topBorderColor="#E85D3A"
          />
          <StatCard
            number={data.active_subjects.length}
            label="Active Subjects"
            delta={data.active_subjects.join(' · ')}
            deltaClass="text-muted"
            topBorderColor="#1B6B4A"
          />
        </div>

        {/* AI Alert bar */}
        <div
          className="flex items-center gap-3 bg-bg-1 border border-border-2 rounded-lg px-4 py-2.5 mb-4"
          style={{ borderLeft: '3px solid var(--warn, #F59E0B)' }}
        >
          <AlertTriangle size={15} className="text-warn shrink-0" strokeWidth={1.5} />
          <p className="text-[11px] font-bold text-ink flex-1">
            AI Alert: {data.ai_alert.topic} — {data.ai_alert.students_below_60}/
            {data.ai_alert.total_students} students below 60% this week · EF avg:{' '}
            {data.ai_alert.ef_avg}
          </p>
          <button className="shrink-0 text-[10px] font-bold border border-border-2 text-ink rounded px-2.5 py-1 hover:bg-bg-2 transition-colors whitespace-nowrap">
            View Topic →
          </button>
        </div>

        {/* Student table */}
        <ClassTable
          students={data.students}
          activeSubjects={data.active_subjects}
          onViewStudent={handleViewStudent}
        />
      </div>
    </div>
  );
}
