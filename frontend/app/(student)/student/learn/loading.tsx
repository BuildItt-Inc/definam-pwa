export default function LearnLoading() {
  return (
    <div className="min-h-screen bg-card">
      <div className="flex items-center border-b border-border px-4 py-3.5 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="h-5 w-28 animate-pulse rounded bg-bg-3" />
      </div>
      <div className="mx-3 my-2 h-10 animate-pulse rounded-lg bg-bg-2" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-4 py-3.5"
        >
          <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-xl bg-bg-3" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 animate-pulse rounded bg-bg-3" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-bg-2" />
          </div>
          <div className="h-5 w-10 animate-pulse rounded bg-bg-2" />
        </div>
      ))}
    </div>
  );
}
