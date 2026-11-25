export default function LearnLoading() {
  return (
    <div className="min-h-screen bg-bg-0">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="h-7 w-28 animate-pulse rounded bg-bg-3" />
            <div className="h-3.5 w-48 animate-pulse rounded bg-bg-2" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-bg-2" />
        </div>
        <div className="mb-3 h-10 animate-pulse rounded-lg bg-bg-2" />
        <div className="mb-4 h-11 animate-pulse rounded-xl border border-border bg-card" />
        <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-lg bg-bg-2" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 animate-pulse rounded bg-bg-3" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-bg-2" />
                <div className="h-1 w-full animate-pulse rounded-full bg-bg-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
