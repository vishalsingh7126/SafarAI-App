import { cn } from '../../lib/cn';

export function Skeleton({ className, rounded = 'rounded-lg' }) {
  return <div className={cn('skeleton', rounded, className)} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ media = true, className }) {
  return (
    <div
      className={cn('overflow-hidden rounded-2xl border border-line bg-surface shadow-card', className)}
      aria-hidden="true"
    >
      {media && <Skeleton className="h-44 w-full" rounded="rounded-none" />}
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-1/2" />
        <SkeletonText lines={2} />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function Spinner({ size = 20, className, label = 'Loading' }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex', className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default Skeleton;
