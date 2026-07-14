'use client';

interface QualityRatingProps {
  onRate: (rating: number) => void;
}

const RATINGS = [
  { value: 0, label: 'No idea' },
  { value: 1, label: 'Forgot' },
  { value: 2, label: 'Hard' },
  { value: 3, label: 'OK' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Perfect' },
] as const;

export function QualityRating({ onRate }: QualityRatingProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {RATINGS.map(({ value, label }) => {
        const isPerfect = value === 5;
        const isStruggling = value <= 1;

        return (
          <button
            key={value}
            onClick={() => onRate(value)}
            className={[
              'flex flex-col items-center rounded-lg py-2.5 transition-opacity active:opacity-70',
              isPerfect
                ? 'border border-white bg-ink text-white'
                : isStruggling
                  ? 'border border-dashed border-white/40 bg-transparent text-white'
                  : 'border border-white/40 bg-transparent text-white',
            ].join(' ')}
          >
            <span className="font-bold text-[16px] font-black leading-tight">{value}</span>
            <span className="mt-0.5 text-[8px] font-semibold leading-tight">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
