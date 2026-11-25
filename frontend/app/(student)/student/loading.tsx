export default function StudentHomeLoading() {
  return (
    <div className="min-h-screen bg-bg-0">
      <div
        className="relative overflow-hidden px-5 pb-6 pt-[calc(env(safe-area-inset-top,0px)+24px)]"
        style={{ background: 'linear-gradient(160deg, #111827 0%, #16321F 130%)' }}
      >
        <div className="mb-1 h-3 w-20 animate-pulse rounded bg-white/10" />
        <div className="mb-1 h-8 w-44 animate-pulse rounded bg-white/20" />
        <div className="mb-4 h-3 w-36 animate-pulse rounded bg-white/10" />
        <div className="flex items-center justify-between">
          <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="mt-3.5 flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[34px] w-[34px] animate-pulse rounded-[10px] bg-white/10" />
          ))}
        </div>
      </div>
      <div className="mt-4 px-4">
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-white" />
      </div>
      <div className="mt-4 space-y-3 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-white" />
        ))}
      </div>
    </div>
  );
}
