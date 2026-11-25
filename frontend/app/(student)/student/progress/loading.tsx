export default function ProgressLoading() {
  return (
    <div className="min-h-screen bg-bg-0">
      <div className="border-b border-border bg-bg-0 px-4 py-3.5 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="h-5 w-28 animate-pulse rounded bg-border-2" />
      </div>
      <div className="px-4 py-4 pb-24">
        <div className="mb-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-bg-2" />
          ))}
        </div>
        <div className="mb-4 h-36 animate-pulse rounded-xl bg-bg-2" />
        <div className="mb-4 h-28 animate-pulse rounded-xl bg-bg-2" />
        <div className="h-32 animate-pulse rounded-xl bg-bg-2" />
      </div>
    </div>
  );
}
