import { Skeleton } from './ui/Skeleton';

/** Shown while a route chunk is being fetched — mirrors the page rhythm. */
export default function RouteFallback() {
  return (
    <div className="content-grid space-y-6 py-10" role="status" aria-live="polite" aria-label="Loading page">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
