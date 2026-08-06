'use client';

import { useEffect, useState } from 'react';
import { getAdminDashboard } from '@/lib/api/admin';
import type { AdminDashboardData, RecallStatus } from '@/types/admin';

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

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-bg-3 rounded-lg ${className}`} />;
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

// ── Aggregation types ──────────────────────────────────────────────────────

interface AccuracyBuckets {
  under40: number;
  from40to59: number;
  from60to79: number;
  from80to100: number;
}

type RecallBreakdown = Record<RecallStatus, number>;

interface WeakestTopicCount {
  topic: string;
  count: number;
}

// ── Aggregation helpers ────────────────────────────────────────────────────

function computeAccuracyBuckets(students: AdminDashboardData['students']): AccuracyBuckets {
  const buckets: AccuracyBuckets = {
    under40: 0,
    from40to59: 0,
    from60to79: 0,
    from80to100: 0,
  };

  for (const student of students) {
    const acc = student.avg_accuracy;
    if (acc < 40) {
      buckets.under40 += 1;
    } else if (acc < 60) {
      buckets.from40to59 += 1;
    } else if (acc < 80) {
      buckets.from60to79 += 1;
    } else {
      buckets.from80to100 += 1;
    }
  }

  return buckets;
}

function computeRecallBreakdown(students: AdminDashboardData['students']): RecallBreakdown {
  const breakdown: RecallBreakdown = {
    on_track: 0,
    overdue: 0,
    not_started: 0,
  };

  for (const student of students) {
    breakdown[student.recall_status] += 1;
  }

  return breakdown;
}

function computeWeakestTopics(students: AdminDashboardData['students']): WeakestTopicCount[] {
  const counts = new Map<string, number>();

  for (const student of students) {
    const topic = student.weakest_topic;
    if (!topic || topic === 'None') continue;
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load analytics'),
      )
      .finally(() => setLoading(false));
  }, []);

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
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-5 bg-bg-0 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <SkeletonBlock className="h-32 w-full mb-4" />
          <SkeletonBlock className="h-32 w-full mb-4" />
          <SkeletonBlock className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const accuracyBuckets = computeAccuracyBuckets(data.students);
  const recallBreakdown = computeRecallBreakdown(data.students);
  const weakestTopics = computeWeakestTopics(data.students);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-card border-b border-border-2 px-5 py-[10px] flex items-center gap-3 shrink-0">
        <div>
          <h1 className="font-bold text-[14px] font-extrabold text-ink leading-tight tracking-tight">
            Analytics
          </h1>
          <p className="text-[10px] text-muted mt-0.5">
            {data.class_name} · {data.total_students} Students · Updated just now
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 bg-bg-0 space-y-5">
        {/* Headline numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            delta="—"
            deltaClass="text-muted"
            topBorderColor="#C8973A"
          />
          <StatCard
            number={data.recall_overdue}
            label="Review Overdue"
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

        {/* AI Alert — plain text for now */}
        <div className="bg-card border border-border-2 rounded-lg p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
            AI Alert
          </h2>
          <div className="text-[12px] text-ink space-y-1">
            <p>Topic: {data.ai_alert.topic}</p>
            <p>Students below 60%: {data.ai_alert.students_below_60} / {data.ai_alert.total_students}</p>
            <p>Average ease factor: {data.ai_alert.ef_avg}</p>
          </div>
        </div>

        {/* Accuracy distribution — plain text */}
        <div className="bg-card border border-border-2 rounded-lg p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
            Accuracy Distribution ({data.students.length} students)
          </h2>
          <div className="text-[12px] text-ink space-y-1">
            <p>Under 40%: {accuracyBuckets.under40}</p>
            <p>40% – 59%: {accuracyBuckets.from40to59}</p>
            <p>60% – 79%: {accuracyBuckets.from60to79}</p>
            <p>80% – 100%: {accuracyBuckets.from80to100}</p>
          </div>
        </div>

        {/* Recall status breakdown — plain text */}
        <div className="bg-card border border-border-2 rounded-lg p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
            Recall Status Breakdown
          </h2>
          <div className="text-[12px] text-ink space-y-1">
            <p>On track: {recallBreakdown.on_track}</p>
            <p>Overdue: {recallBreakdown.overdue}</p>
            <p>Not started: {recallBreakdown.not_started}</p>
          </div>
        </div>

        {/* Weakest topics ranked — plain text */}
        <div className="bg-card border border-border-2 rounded-lg p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
            Top Weakest Topics
          </h2>
          {weakestTopics.length === 0 ? (
            <p className="text-[12px] text-muted">No weakest-topic data available.</p>
          ) : (
            <ol className="text-[12px] text-ink space-y-1 list-decimal list-inside">
              {weakestTopics.map(({ topic, count }) => (
                <li key={topic}>
                  {topic} — {count} student{count === 1 ? '' : 's'}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
