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

<<<<<<< HEAD
// ── Chart: accuracy distribution (horizontal bars) ─────────────────────────

interface AccuracyBarRowProps {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}

function AccuracyBarRow({ label, count, total, colorClass }: AccuracyBarRowProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-[11px] font-semibold text-muted">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-bg-2 overflow-hidden">
        {pct > 0 && (
          <div
            className={`h-full rounded-full ${colorClass}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <span className="w-6 shrink-0 text-[11px] font-bold text-ink text-right">{count}</span>
    </div>
  );
}

function AccuracyDistributionChart({
  buckets,
  total,
}: {
  buckets: AccuracyBuckets;
  total: number;
}) {
  return (
    <div className="space-y-2.5">
      <AccuracyBarRow label="< 40%" count={buckets.under40} total={total} colorClass="bg-coral" />
      <AccuracyBarRow label="40–59%" count={buckets.from40to59} total={total} colorClass="bg-gold" />
      <AccuracyBarRow label="60–79%" count={buckets.from60to79} total={total} colorClass="bg-jade-light" />
      <AccuracyBarRow label="80–100%" count={buckets.from80to100} total={total} colorClass="bg-jade" />
    </div>
  );
}

// ── Chart: recall status (stacked bar + legend) ─────────────────────────────

const RECALL_LEGEND: Array<{ key: RecallStatus; label: string; dotClass: string }> = [
  { key: 'on_track', label: 'On track', dotClass: 'bg-jade' },
  { key: 'overdue', label: 'Overdue', dotClass: 'bg-gold' },
  { key: 'not_started', label: 'Not started', dotClass: 'bg-border-2' },
];

function RecallStackedBar({ breakdown, total }: { breakdown: RecallBreakdown; total: number }) {
  if (total === 0) {
    return <div className="h-3 w-full rounded-full bg-bg-2" />;
  }

  const onTrackPct = (breakdown.on_track / total) * 100;
  const overduePct = (breakdown.overdue / total) * 100;
  const notStartedPct = (breakdown.not_started / total) * 100;

  return (
    <div className="flex h-3 w-full rounded-full overflow-hidden bg-bg-2">
      {onTrackPct > 0 && <div className="h-full bg-jade" style={{ width: `${onTrackPct}%` }} />}
      {overduePct > 0 && <div className="h-full bg-gold" style={{ width: `${overduePct}%` }} />}
      {notStartedPct > 0 && (
        <div className="h-full bg-border-2" style={{ width: `${notStartedPct}%` }} />
      )}
    </div>
  );
}

function RecallStatusChart({ breakdown, total }: { breakdown: RecallBreakdown; total: number }) {
  return (
    <div className="space-y-3">
      <RecallStackedBar breakdown={breakdown} total={total} />
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {RECALL_LEGEND.map(({ key, label, dotClass }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className="text-[11px] font-semibold text-muted">
              {label}: <span className="text-ink font-bold">{breakdown[key]}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chart: weakest topics (ranked list with relative bars) ─────────────────

function WeakestTopicsChart({ topics }: { topics: WeakestTopicCount[] }) {
  if (topics.length === 0) {
    return <p className="text-[12px] text-muted">No weakest-topic data available.</p>;
  }

  const maxCount = topics[0].count;

  return (
    <ol className="space-y-2">
      {topics.map(({ topic, count }, i) => {
        const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return (
          <li key={topic} className="relative h-9 rounded-md bg-bg-2 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-coral-tint"
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between h-full px-3 gap-3">
              <span className="text-[12px] font-semibold text-ink truncate">
                <span className="text-muted font-bold mr-1.5">#{i + 1}</span>
                {topic}
              </span>
              <span className="shrink-0 text-[11px] font-bold text-ink">
                {count} student{count === 1 ? '' : 's'}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

=======
>>>>>>> ff704381cb77d53dd3fb8485a67c8ec082f2de02
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
<<<<<<< HEAD
  const totalStudentsWithData = data.students.length;
=======
>>>>>>> ff704381cb77d53dd3fb8485a67c8ec082f2de02

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-card border-b border-border-2 px-5 py-[10px] flex items-center gap-3 shrink-0">
        <div>
<<<<<<< HEAD
          <h1 className="text-[14px] font-extrabold text-ink leading-tight tracking-tight">
=======
          <h1 className="font-bold text-[14px] font-extrabold text-ink leading-tight tracking-tight">
>>>>>>> ff704381cb77d53dd3fb8485a67c8ec082f2de02
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

<<<<<<< HEAD
        {/* Accuracy distribution — horizontal bar chart */}
        <div className="bg-card border border-border-2 rounded-lg p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3">
            Accuracy Distribution ({totalStudentsWithData} students)
          </h2>
          <AccuracyDistributionChart buckets={accuracyBuckets} total={totalStudentsWithData} />
        </div>

        {/* Recall status breakdown — stacked bar + legend */}
        <div className="bg-card border border-border-2 rounded-lg p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3">
            Recall Status Breakdown
          </h2>
          <RecallStatusChart breakdown={recallBreakdown} total={totalStudentsWithData} />
        </div>

        {/* Weakest topics ranked — bars sized by relative student count */}
        <div className="bg-card border border-border-2 rounded-lg p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3">
            Top Weakest Topics
          </h2>
          <WeakestTopicsChart topics={weakestTopics} />
=======
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
>>>>>>> ff704381cb77d53dd3fb8485a67c8ec082f2de02
        </div>
      </div>
    </div>
  );
}
