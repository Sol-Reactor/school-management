import { cn } from '../../lib/cn';

/** Placeholder block shaped like the content it replaces (reserves layout → no jumping). */
export const Skeleton = ({ className }) => (
  <span
    aria-hidden="true"
    className={cn('relative block overflow-hidden rounded-md bg-surface-muted', className)}
  >
    <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/60 to-transparent motion-reduce:hidden" />
  </span>
);

export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)} aria-hidden="true">
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

/** Wraps skeleton content with a screen-reader status so loading is announced once. */
export const LoadingRegion = ({ label = 'Loading…', children, className }) => (
  <div role="status" aria-live="polite" className={className}>
    <span className="sr-only">{label}</span>
    {children}
  </div>
);

export const StatCardSkeleton = () => (
  <div className="card p-5" aria-hidden="true">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="mt-4 h-8 w-20" />
    <Skeleton className="mt-3 h-3 w-32" />
  </div>
);

export const TableSkeleton = ({ rows = 6, columns = 4 }) => (
  <div aria-hidden="true" className="divide-y divide-line">
    {Array.from({ length: rows }, (_, r) => (
      <div key={r} className="flex items-center gap-4 px-5 py-3.5">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton key={c} className={cn('h-3.5', c === 0 ? 'w-40' : 'hidden w-24 sm:block')} />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
