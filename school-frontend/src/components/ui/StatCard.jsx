import { LuArrowDownRight, LuArrowUpRight, LuMinus } from 'react-icons/lu';
import { cn } from '../../lib/cn';

/**
 * KPI tile: label, headline value, optional delta and context line.
 * The delta carries an arrow icon + words, never colour alone; `goodWhen`
 * decides whether "up" is good (attendance) or bad (absences).
 */
const StatCard = ({ label, value, icon: Icon, delta, deltaLabel, goodWhen = 'up', hint, className }) => {
  const direction = delta == null || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
  const positive = direction === 'flat' ? null : direction === goodWhen;
  const DeltaIcon = direction === 'up' ? LuArrowUpRight : direction === 'down' ? LuArrowDownRight : LuMinus;

  return (
    <div className={cn('card flex flex-col p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-ink">
            <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink tabular">{value}</p>
      {(delta != null || hint) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
          {delta != null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                positive === null ? 'bg-surface-muted text-ink-muted' : positive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
              )}
            >
              <DeltaIcon aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="tabular">{direction === 'flat' ? 'No change' : `${Math.abs(delta)}${deltaLabel ?? ''}`}</span>
              <span className="sr-only">{direction === 'flat' ? '' : direction === 'up' ? ' increase' : ' decrease'}</span>
            </span>
          )}
          {hint && <span>{hint}</span>}
        </p>
      )}
    </div>
  );
};

export default StatCard;
