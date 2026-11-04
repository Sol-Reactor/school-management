import { cn } from '../../lib/cn';

/** Friendly "nothing here yet" with a next step. */
const EmptyState = ({ icon: Icon, title, description, action, className, compact = false }) => (
  <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
    {Icon && (
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </span>
    )}
    <h3 className="text-base font-semibold text-ink">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
