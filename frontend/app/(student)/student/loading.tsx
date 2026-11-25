export default function StudentHomeLoading() {
  return (
    <div className="min-h-screen bg-bg-0">
      <div className="border-b border-border bg-card px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-bg-2" />
            <div className="h-7 w-40 animate-pulse rounded bg-bg-3" />
            <div className="h-3 w-32 animate-pulse rounded bg-bg-2" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-bg-2" />
        </div>
      </div>
      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
