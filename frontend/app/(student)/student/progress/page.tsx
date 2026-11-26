'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getProgressData,
  getCachedProgressData,
  getSubjects,
  getCachedSubjects,
} from '@/lib/api/topics';
import type { ProgressData, Subject } from '@/types/topics';
import {
  getStudentProfile,
  filterSubjectsByProfile,
  normalizeSubjectName,
  type StudentProfile,
} from '@/lib/utils/studentProfile';

const HEATMAP_COLORS = [
  'var(--heat-0)',
  'var(--heat-1)',
  'var(--heat-2)',
  'var(--heat-3)',
  'var(--heat-4)',
] as const;

function heatmapColor(level: number): string {
  return HEATMAP_COLORS[Math.min(Math.max(Math.round(level), 0), 4)];
}

function ProgressSkeleton() {
  return (
    <div className="page-with-nav bg-bg-0">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pb-24 pt-[calc(env(safe-area-inset-top)+16px)] md:pt-7">
        <div className="mb-4 h-7 w-32 animate-pulse rounded bg-bg-3" />
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-bg-2" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="h-56 animate-pulse rounded-2xl bg-bg-2" />
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-2xl bg-bg-2" />
            <div className="h-36 animate-pulse rounded-2xl bg-bg-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  variant,
  value,
  label,
}: {
  variant: 'streak' | 'plain';
  value: string;
  label: string;
}) {
  if (variant === 'streak') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-[#14201B] dark:bg-[#171C1A] dark:border dark:border-border px-4 py-4 text-center shadow-xs">
        <span className="text-[26px] font-bold leading-none text-white tabular-nums">
          {value}
        </span>
        <span className="mt-1.5 text-[12px] font-medium text-white/70">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-4 text-center">
      <span className="text-[26px] font-bold leading-none text-ink tabular-nums">
        {value}
      </span>
      <span className="mt-1.5 text-[12px] font-medium text-muted">{label}</span>
    </div>
  );
}

function MasterySection({
  items,
}: {
  items: Array<{ subject: string; mastery_percent: number }>;
}) {
  return (
    <section className="mb-4 rounded-2xl border border-border bg-card p-4">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink">Subject mastery</h2>
        <span className="text-[12.5px] text-muted">
          {items.length} {items.length === 1 ? 'subject' : 'subjects'}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-muted">
          Pick your subjects to begin tracking mastery.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const pct = Math.max(0, Math.min(100, Math.round(item.mastery_percent)));
            return (
              <div key={item.subject}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-medium text-ink">
                    {item.subject}
                  </span>
                  <span
                    className={`flex-shrink-0 text-[13px] font-semibold tabular-nums ${
                      pct > 0 ? 'text-brand' : 'text-muted'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-2">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HeatmapSection({ data }: { data: number[] }) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const effectiveData = data && data.length > 0 ? data : Array.from({ length: 84 }, () => 0);

  const { cells, numWeeks, monthLabels } = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(12, 0, 0, 0);
    const startMs = todayStart.getTime() - (effectiveData.length - 1) * MS_PER_DAY;
    const startDow = new Date(startMs).getDay();
    const weeks = Math.ceil((startDow + effectiveData.length) / 7);

    const startDate = new Date(startMs);
    const midDate = new Date(startMs + Math.floor(effectiveData.length / 2) * MS_PER_DAY);
    const endDate = todayStart;
    const labels = [
      startDate.toLocaleDateString('en-US', { month: 'short' }),
      midDate.toLocaleDateString('en-US', { month: 'short' }),
      endDate.toLocaleDateString('en-US', { month: 'short' }),
    ];

    const built = Array.from({ length: weeks * 7 }, (_, cellIdx) => {
      const dataIdx = cellIdx - startDow;
      if (dataIdx < 0 || dataIdx >= effectiveData.length) {
        return { key: cellIdx, empty: true as const, count: 0, dateLabel: '' };
      }
      const count = effectiveData[dataIdx] ?? 0;
      const cellDate = new Date(startMs + dataIdx * MS_PER_DAY);
      const dateLabel = cellDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return { key: cellIdx, empty: false as const, count, dateLabel };
    });

    return { cells: built, numWeeks: weeks, monthLabels: labels };
  }, [effectiveData, MS_PER_DAY]);

  return (
    <section className="mb-4 rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink">Study activity</h2>
        <span className="text-[12.5px] text-muted">Last 3 months</span>
      </div>

      {/* Dynamic month row */}
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted">
        <span>{monthLabels[0]}</span>
        <span>{monthLabels[1]}</span>
        <span>{monthLabels[2]}</span>
      </div>

      {/* Activity Grid */}
      <div className="overflow-x-auto">
        <div
          className="grid w-full gap-[3px]"
          style={{
            gridTemplateRows: 'repeat(7, minmax(10px, 1fr))',
            gridTemplateColumns: `repeat(${numWeeks}, minmax(10px, 1fr))`,
            gridAutoFlow: 'column',
          }}
        >
          {cells.map((cell) =>
            cell.empty ? (
              <div key={cell.key} className="aspect-square w-full rounded-[3px]" />
            ) : (
              <button
                key={cell.key}
                type="button"
                aria-label={`${cell.dateLabel}: ${cell.count} activities`}
                className="aspect-square w-full rounded-[3px] transition-transform hover:scale-110 focus:outline-none"
                style={{ backgroundColor: heatmapColor(cell.count) }}
                onMouseEnter={() => setTooltip({ date: cell.dateLabel, count: cell.count })}
                onMouseLeave={() => setTooltip(null)}
                onClick={() =>
                  setTooltip((prev) =>
                    prev?.date === cell.dateLabel
                      ? null
                      : { date: cell.dateLabel, count: cell.count },
                  )
                }
              />
            ),
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted">Less</span>
          {HEATMAP_COLORS.slice(0, 4).map((color) => (
            <span
              key={color}
              className="inline-block h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[11px] text-muted">More</span>
        </div>

        <span className="min-h-[16px] text-[11px] text-muted">
          {tooltip
            ? `${tooltip.date} · ${tooltip.count} review${tooltip.count !== 1 ? 's' : ''}`
            : ''}
        </span>
      </div>
    </section>
  );
}

function getDueDayOffset(dueText: string): number | null {
  const lower = dueText.trim().toLowerCase();
  if (lower === 'today') return 0;
  if (lower === 'tomorrow') return 1;
  const inDays = lower.match(/in\s+(\d+)\s+day/);
  if (inDays) return Number(inDays[1]);
  const parsed = Date.parse(dueText);
  if (!Number.isNaN(parsed)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(parsed);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }
  return null;
}

function UpcomingSection({ data }: { data: ProgressData['upcoming_reviews'] }) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const counts = Array.from({ length: 7 }, () => 0);

    for (const item of data) {
      const offset = getDueDayOffset(item.due);
      if (offset !== null && offset >= 0 && offset < 7) {
        counts[offset] += 1;
      }
    }

    return counts.map((count, offset) => {
      const d = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
      return {
        key: offset,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
        isToday: offset === 0,
      };
    });
  }, [data]);

  return (
    <section className="mb-4 rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[15px] font-bold text-ink">Upcoming reviews</h2>

      {/* Dynamic 7-day strip */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {weekDays.map((day) => (
          <div key={day.key} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted">{day.label}</span>
            <div
              className={`flex h-9 w-full items-center justify-center rounded-xl text-[14px] font-bold tabular-nums ${
                day.count > 0
                  ? 'bg-brand-tint text-brand'
                  : 'bg-bg-2/75 text-ink'
              }`}
            >
              {day.count}
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="mt-3.5 text-[12.5px] leading-relaxed text-muted">
          Finish a topic and its review cards will show up here.
        </p>
      ) : (
        <div className="mt-3.5 divide-y divide-border border-t border-border pt-1">
          {data.map((item) => {
            const isToday = item.due.toLowerCase() === 'today';
            return (
              <div
                key={`${item.topic_title}-${item.due}`}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                  {item.topic_title}
                </span>
                <span
                  className={`flex-shrink-0 text-[12.5px] font-semibold ${
                    isToday ? 'text-brand' : 'text-muted'
                  }`}
                >
                  {item.due}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(() => getCachedProgressData());
  const [subjects, setSubjects] = useState<Subject[] | null>(() => getCachedSubjects());
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(getStudentProfile());
    };
    window.addEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
    window.addEventListener('focus', handleProfileUpdate);
    return () => {
      window.removeEventListener('studentProfileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('focus', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    setFetchError(null);
    getProgressData()
      .then(setData)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });

    getSubjects()
      .then(setSubjects)
      .catch(() => {});
  }, [retryTick]);

  const displayMastery = useMemo(() => {
    if (!data) return [];

    const masteryMap = new Map<string, number>();
    for (const item of data.subject_mastery) {
      masteryMap.set(normalizeSubjectName(item.subject), item.mastery_percent);
    }

    // Prefer the student's active curriculum subjects so newly enrolled accounts show all chosen subjects at 0%
    if (subjects && subjects.length > 0) {
      const selected = filterSubjectsByProfile(subjects, profile);
      return selected.map((subj) => ({
        subject: subj.name,
        mastery_percent:
          masteryMap.get(normalizeSubjectName(subj.name)) ?? subj.mastery_percent ?? 0,
      }));
    }

    if (profile?.selectedSubjects && profile.selectedSubjects.length > 0) {
      return profile.selectedSubjects.map((name) => ({
        subject: name,
        mastery_percent: masteryMap.get(normalizeSubjectName(name)) ?? 0,
      }));
    }

    return data.subject_mastery;
  }, [data, subjects, profile]);

  if (fetchError && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-0 px-6 text-center">
        <p className="text-sm text-muted">{fetchError}</p>
        <button
          type="button"
          onClick={() => setRetryTick((n) => n + 1)}
          className="btn-primary px-5 text-xs"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return <ProgressSkeleton />;

  return (
    <div className="page-with-nav bg-bg-0 page-enter">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+16px)] md:pt-7 pb-nav">
        <h1 className="mb-4 md:mb-5 text-[24px] sm:text-[26px] font-bold tracking-tight text-ink">My Progress</h1>

        <div className="mb-4 md:mb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard variant="streak" value={String(data.streak_days)} label="Day streak" />
          <StatCard variant="plain" value={String(data.topics_studied)} label="Topics studied" />
          <StatCard variant="plain" value={`${data.avg_accuracy}%`} label="Avg accuracy" />
          <StatCard variant="plain" value={String(data.due_tomorrow)} label="Due tomorrow" />
        </div>

        <div className="lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-5 lg:items-start">
          <HeatmapSection data={data.heatmap_data} />
          <div className="min-w-0">
            <MasterySection items={displayMastery} />
            <UpcomingSection data={data.upcoming_reviews} />
          </div>
        </div>
      </main>
    </div>
  );
}
