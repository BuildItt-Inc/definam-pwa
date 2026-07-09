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
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="h-7 w-12 bg-gray-200 rounded mb-2" />
      <div className="h-2.5 w-24 bg-gray-100 rounded mb-2" />
      <div className="h-2.5 w-20 bg-gray-100 rounded" />
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
    <tr className="border-b border-gray-100 animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-[9px]">
          <div className="h-3 bg-gray-100 rounded" style={{ width: i === 0 ? '120px' : '60px' }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-[10px] border-b border-gray-200">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="ml-auto flex gap-2">
          <div className="h-7 w-36 bg-gray-100 rounded-md" />
          <div className="h-7 w-28 bg-gray-100 rounded-md" />
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {['Student', 'Streak', 'Recall Status', 'Avg Accuracy', 'Weakest Topic', 'Last Active', ''].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-[7px] text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400"
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

function StatCard({ number, label, delta, deltaClass = 'text-gray-500', topBorderColor }: StatCardProps) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4"
      style={{ borderTop: `3px solid ${topBorderColor}` }}
    >
      <div className="text-[22px] font-black text-ink leading-none tracking-tight">
        {number}
      </div>
      <div className="text-[10px] text-gray-400 mt-1">{label}</div>
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
        <p className="text-[13px] text-coral font-semibold">{error}</p>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div className="flex flex-col h-full">
        {/* Top bar skeleton */}
        <div className="bg-white border-b border-gray-200 px-5 py-[10px] flex items-center gap-3 animate-pulse">
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-1.5" />
            <div className="h-2.5 w-48 bg-gray-100 rounded" />
          </div>
          <div className="ml-auto h-8 w-28 bg-gray-100 rounded-md" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-5 bg-gray-50 overflow-y-auto">
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
  const accuracyDeltaClass = data.accuracy_delta < 0 ? 'text-coral' : 'text-jade';

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-[10px] flex items-center gap-3 shrink-0">
        <div>
          <h1 className="font-syne text-[14px] font-extrabold text-ink leading-tight tracking-tight">
            Class Overview
          </h1>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {data.class_name} · {data.total_students} Students · Updated just now
          </p>
        </div>
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 text-[11px] font-bold border border-gray-200 bg-white text-ink rounded-md px-3 py-[5px] hover:border-ink transition-colors">
            <Download size={13} strokeWidth={1.5} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
        {/* 4 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard
            number={data.total_students}
            label="Total Students"
            delta={`↑ ${data.active_this_week} active this week`}
            deltaClass="text-gray-500"
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
            deltaClass="text-gray-500"
            topBorderColor="#E85D3A"
          />
          <StatCard
            number={data.active_subjects.length}
            label="Active Subjects"
            delta={data.active_subjects.join(' · ')}
            deltaClass="text-gray-500"
            topBorderColor="#1B6B4A"
          />
        </div>

        {/* AI Alert bar */}
        <div
          className="flex items-center gap-3 bg-gold-tint border border-amber-200 rounded-lg px-4 py-2.5 mb-4"
          style={{ borderLeft: '3px solid #C8973A' }}
        >
          <AlertTriangle size={15} className="text-gold shrink-0" strokeWidth={1.5} />
          <p className="text-[11px] font-bold text-[#633806] flex-1">
            AI Alert: {data.ai_alert.topic} — {data.ai_alert.students_below_60}/
            {data.ai_alert.total_students} students below 60% this week · EF avg:{' '}
            {data.ai_alert.ef_avg}
          </p>
          <button className="shrink-0 text-[10px] font-bold border border-gold text-[#633806] rounded px-2.5 py-1 hover:bg-amber-100 transition-colors whitespace-nowrap">
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
