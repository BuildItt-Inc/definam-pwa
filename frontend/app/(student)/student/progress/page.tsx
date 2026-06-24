'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { getProgressData } from '@/lib/api/topics';
import type { ProgressData } from '@/types/topics';
import { BottomNav } from '@/components/student/BottomNav';

// ── Heatmap config ─────────────────────────────────────────────────────────

const HEATMAP_COLORS = ['#EEEEEE', '#9FE1CB', '#5DCAA5', '#1B6B4A', '#085041'] as const;

function heatmapColor(level: number): string {
  return HEATMAP_COLORS[Math.min(Math.max(Math.round(level), 0), 4)];
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function ProgressSkeleton() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Appbar */}
      <div className="border-b border-gray-200/60 bg-cream px-4 py-3.5">
        <div className="h-5 w-28 animate-pulse rounded bg-gray-300/50" />
      </div>

      <div className="px-4 py-4 pb-24">
        {/* Stat cards */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-300/40" />
          ))}
        </div>

        {/* Subject mastery */}
        <div className="mb-4 h-36 animate-pulse rounded-xl bg-gray-300/40" />

        {/* Heatmap */}
        <div className="mb-4 h-28 animate-pulse rounded-xl bg-gray-300/40" />

        {/* Upcoming reviews */}
        <div className="h-32 animate-pulse rounded-xl bg-gray-300/40" />
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  variant: 'streak' | 'plain';
  value: string;
  label: string;
}

function StatCard({ variant, value, label }: StatCardProps) {
  if (variant === 'streak') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-jade px-3 py-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Flame size={22} strokeWidth={1.5} className="text-white/80" />
          <span className="font-syne text-[28px] font-black leading-none text-white">
            {value}
          </span>
        </div>
        <span className="font-dm-sans text-[11px] text-white/70">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200/80 bg-white px-3 py-4">
      <span className="font-syne text-[28px] font-black leading-none text-ink">{value}</span>
      <span className="mt-1 font-dm-sans text-[11px] text-gray-400">{label}</span>
    </div>
  );
}

// ── Subject mastery section ────────────────────────────────────────────────

function MasterySection({ data }: { data: ProgressData['subject_mastery'] }) {
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <span className="font-dm-sans text-[11px] font-bold text-ink">Subject Mastery</span>
      </div>
      <div className="bg-white px-4 py-3">
        {data.map((item, idx) => {
          const isGood = item.mastery_percent >= 60;
          const pctText = `${item.mastery_percent}%`;
          return (
            <div key={item.subject} className={idx < data.length - 1 ? 'mb-3' : ''}>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-dm-sans text-[13px] font-semibold text-ink">
                  {item.subject}
                </span>
                <span
                  className={`font-dm-sans text-[13px] font-bold ${
                    isGood ? 'text-jade' : 'text-gold'
                  }`}
                >
                  {pctText}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${isGood ? 'bg-jade' : 'bg-gold'}`}
                  style={{ width: pctText }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Heatmap section ────────────────────────────────────────────────────────

function HeatmapSection({ data }: { data: number[] }) {
  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="mb-3 font-dm-sans text-[11px] font-bold text-ink">
        Study Activity — 3 Months
      </p>

      {/* 63 squares: 9 weeks × 7 days, displayed as 7-column grid (day columns, week rows) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 9px)',
          gridTemplateRows: 'repeat(7, 9px)',
          gridAutoFlow: 'column',
          gap: '2px',
        }}
      >
        {data.map((level, i) => (
          <div
            key={i}
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '2px',
              backgroundColor: heatmapColor(level),
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="font-dm-sans text-[9px] text-gray-400">Less</span>
        {HEATMAP_COLORS.map((color) => (
          <div
            key={color}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: color,
            }}
          />
        ))}
        <span className="font-dm-sans text-[9px] text-gray-400">More</span>
      </div>
    </div>
  );
}

// ── Upcoming reviews section ───────────────────────────────────────────────

function UpcomingSection({ data }: { data: ProgressData['upcoming_reviews'] }) {
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <span className="font-dm-sans text-[11px] font-bold text-ink">Upcoming Reviews</span>
      </div>
      <div className="bg-white">
        {data.map((item, idx) => {
          const isLast = idx === data.length - 1;
          const isToday = item.due.toLowerCase() === 'today';

          const dotClass =
            item.urgency === 'high'
              ? 'bg-jade'
              : item.urgency === 'medium'
                ? 'bg-gold'
                : 'border border-gray-300 bg-gray-100';

          return (
            <div
              key={item.topic_title}
              className={`flex items-center gap-3 px-4 py-3 ${
                !isLast ? 'border-b border-gray-100' : ''
              }`}
            >
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`}
              />
              <span className="min-w-0 flex-1 font-dm-sans text-[13px] font-semibold text-ink">
                {item.topic_title}
              </span>
              <span
                className={`flex-shrink-0 font-dm-sans text-[12px] font-bold ${
                  isToday ? 'text-jade' : 'text-gray-400'
                }`}
              >
                {item.due}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    getProgressData()
      .then(setData)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, []);

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6">
        <p className="text-center font-dm-sans text-sm text-gray-500">{fetchError}</p>
      </div>
    );
  }

  if (!data) return <ProgressSkeleton />;

  return (
    <div className="flex min-h-screen flex-col bg-cream">

      {/* Appbar */}
      <header className="border-b border-gray-200/60 bg-cream px-4 py-3.5">
        <h1 className="font-syne text-[17px] font-bold text-ink">My Progress</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">

        {/* ── Stat cards 2×2 ──────────────────────────────────────────────── */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatCard
            variant="streak"
            value={String(data.streak_days)}
            label="day streak"
          />
          <StatCard
            variant="plain"
            value={String(data.topics_studied)}
            label="topics studied"
          />
          <StatCard
            variant="plain"
            value={`${data.avg_accuracy}%`}
            label="avg accuracy"
          />
          <StatCard
            variant="plain"
            value={String(data.due_tomorrow)}
            label="due tomorrow"
          />
        </div>

        {/* ── Subject mastery ──────────────────────────────────────────────── */}
        <MasterySection data={data.subject_mastery} />

        {/* ── Study heatmap ────────────────────────────────────────────────── */}
        <HeatmapSection data={data.heatmap_data} />

        {/* ── Upcoming reviews ─────────────────────────────────────────────── */}
        <UpcomingSection data={data.upcoming_reviews} />

      </main>

      <BottomNav />
    </div>
  );
}
