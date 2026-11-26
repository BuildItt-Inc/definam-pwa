export default function StudentHomeLoading() {
  return (
    <div className="min-h-screen bg-bg-0">
      <div className="mx-auto max-w-5xl px-4 md:px-7 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-12">
        <div className="mb-4 h-7 w-36 animate-pulse rounded-lg bg-bg-2" />
        <div className="mb-4 h-28 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    </div>
  );
}
