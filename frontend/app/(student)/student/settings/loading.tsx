export default function SettingsLoading() {
  return (
    <div className="page-with-nav bg-bg-0">
      <div className="border-b border-border bg-bg-0 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="h-5 w-20 animate-pulse rounded bg-border-2" />
      </div>
      <div className="px-4 py-4">
        <div className="mb-4 h-20 animate-pulse rounded-xl bg-bg-3" />
        <div className="mb-4 h-36 animate-pulse rounded-xl bg-bg-3" />
        <div className="h-10 animate-pulse rounded-xl bg-bg-3" />
      </div>
    </div>
  );
}
