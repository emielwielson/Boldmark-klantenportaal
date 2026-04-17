function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-black/[0.06] ${className ?? ""}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-7 w-40" />
            <SkeletonBlock className="h-4 w-64 max-w-full" />
            <SkeletonBlock className="h-3 w-48" />
          </div>
          <SkeletonBlock className="h-9 w-28 shrink-0 rounded-lg" />
        </header>

        <div className="rounded-lg border border-black/[0.06] bg-white px-4 py-3 shadow-sm md:px-5">
          <SkeletonBlock className="h-4 w-full max-w-md" />
          <SkeletonBlock className="mt-2 h-3 w-3/4 max-w-sm" />
        </div>

        <div className="space-y-4 md:hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-black/[0.06] bg-white p-4 shadow-sm"
            >
              <SkeletonBlock className="h-5 w-2/3" />
              <SkeletonBlock className="mt-4 h-10 w-full" />
              <SkeletonBlock className="mt-3 h-10 w-full" />
              <SkeletonBlock className="mt-3 h-9 w-24" />
            </div>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-sm md:block">
          <div className="border-b border-black/[0.06] px-4 py-3">
            <SkeletonBlock className="h-4 w-32" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 border-b border-black/[0.04] px-4 py-4 last:border-0"
            >
              <SkeletonBlock className="h-4 w-48 shrink-0" />
              <SkeletonBlock className="h-4 flex-1" />
              <SkeletonBlock className="h-4 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
