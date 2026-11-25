interface CompletionRingProps {
  /** 0-100. Clamped defensively — a stray out-of-range value shouldn't
   * produce a visually broken ring (negative dashoffset, etc). */
  percent: number;
  size?: number;
}

/**
 * Small circular progress ring for the dashboard header's overall-completion
 * metric (distinct topics studied / total topics in the curriculum — see
 * completion_percent on GET /students/dashboard). Not per-topic mastery.
 */
export function CompletionRing({ percent, size = 40 }: CompletionRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size / 40) * 16;
  const strokeWidth = (size / 40) * 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#4ADE80"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-bold text-white"
        style={{ fontSize: (size / 40) * 9.5 }}
      >
        {clamped}%
      </span>
    </div>
  );
}
