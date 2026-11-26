'use client';

import { Loader2 } from 'lucide-react';

interface QualityRatingProps {
  onRate: (rating: number) => void;
  submittingRating?: number | null;
}

const RATINGS = [
  { value: 0, label: 'No idea' },
  { value: 1, label: 'Forgot' },
  { value: 2, label: 'Hard' },
  { value: 3, label: 'OK' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Perfect' },
] as const;

export function QualityRating({ onRate, submittingRating = null }: QualityRatingProps) {
  const isBusy = submittingRating !== null;

  return (
    <div className="grid grid-cols-6 gap-1.5">
      {RATINGS.map(({ value, label }) => {
        const isPerfect = value === 5;
        const isStruggling = value <= 1;
        const isThisSubmitting = submittingRating === value;

        return (
          <button
            key={value}
            type="button"
            disabled={isBusy}
            onClick={() => onRate(value)}
            className={[
              'flex min-h-[54px] flex-col items-center justify-center rounded-lg py-2.5 transition-all active:scale-95 disabled:cursor-not-allowed',
              isThisSubmitting ? 'opacity-90 ring-2 ring-brand-light' : isBusy ? 'opacity-40' : '',
              isPerfect
                ? 'border border-white bg-white/15 text-white'
                : isStruggling
                  ? 'border border-dashed border-white/40 bg-transparent text-white'
                  : 'border border-white/40 bg-transparent text-white',
            ].join(' ')}
          >
            {isThisSubmitting ? (
              <Loader2 size={16} className="animate-spin text-brand-light" />
            ) : (
              <span className="text-[16px] font-black leading-tight">{value}</span>
            )}
            <span className="mt-0.5 text-[8px] font-semibold leading-tight">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
