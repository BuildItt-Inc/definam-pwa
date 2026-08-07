// Pure CSS/SVG suggestion of the app's student home screen — no screenshot
// asset. Kept deliberately simple (greeting, one progress ring, three topic
// rows) rather than a pixel-accurate recreation, since the brief calls for
// "a tasteful, on-brand suggestion," not a real screenshot.

const TOPICS = [
  { subject: 'M', title: 'Quadratic Equations', progress: 72 },
  { subject: 'C', title: 'Periodic Trends', progress: 45 },
  { subject: 'E', title: 'Comprehension Skills', progress: 90 },
];

export default function HeroPhoneMockup() {
  const ringProgress = 68;

  return (
    <div
      aria-hidden="true"
      className="mx-auto w-[240px] rounded-[2.5rem] border border-white/10 bg-ink p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:w-[260px]"
    >
      {/* Notch */}
      <div className="mb-2 flex justify-center">
        <div className="h-[18px] w-[70px] rounded-full bg-black/40" />
      </div>

      {/* Screen */}
      <div className="rounded-[2rem] bg-white px-4 pb-5 pt-4">
        {/* Greeting */}
        <p className="text-[10px] text-muted">Good afternoon,</p>
        <p className="mb-4 text-[14px] font-bold text-ink">Ada 👋</p>

        {/* Progress ring + streak */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-bg-2 p-3">
          <div
            className="relative h-12 w-12 flex-shrink-0 rounded-full"
            style={{
              background: `conic-gradient(#16A34A ${ringProgress * 3.6}deg, #DDE9E1 0deg)`,
            }}
          >
            <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-white text-[10px] font-bold text-ink">
              {ringProgress}%
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink">This week</p>
            <p className="text-[10px] text-muted">3 topics reviewed</p>
          </div>
        </div>

        {/* Topic rows */}
        <div className="flex flex-col gap-2">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="flex items-center gap-2.5 rounded-xl bg-bg-2 px-2.5 py-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-jade-tint text-[11px] font-bold text-jade">
                {topic.subject}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10.5px] font-semibold text-ink">{topic.title}</p>
                <div className="mt-1 h-1 w-full rounded-full bg-bg-3">
                  <div
                    className="h-1 rounded-full bg-jade"
                    style={{ width: `${topic.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
