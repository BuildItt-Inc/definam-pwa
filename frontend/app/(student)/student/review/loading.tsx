export default function ReviewLoading() {
  return (
    <div className="min-h-screen bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="h-5 w-5 animate-pulse rounded bg-bg-3" />
        <div className="h-5 w-28 animate-pulse rounded bg-bg-3" />
      </div>
      <div className="px-4 py-4">
        <div className="mb-4 h-20 animate-pulse rounded-xl bg-bg-2" />
        <div className="mb-4 h-2 animate-pulse rounded-full bg-bg-2" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="mb-2 flex items-center gap-3 rounded-xl border border-border px-3.5 py-3"
          >
            <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-lg bg-bg-3" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-bg-3" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-bg-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
