// Thin segmented bar of attendance statuses + a labelled legend with counts.
// Status colours are reserved, and each status also carries an icon + label.
import { STATUS_META, STATUS_ORDER as ORDER } from '../../lib/attendanceStatus';



const AttendanceBreakdown = ({ counts }) => {
  const total = ORDER.reduce((s, k) => s + (counts[k] || 0), 0);
  if (!total) return <p className="text-sm text-ink-subtle">No attendance recorded yet.</p>;

  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded" aria-hidden="true">
        {ORDER.filter((k) => counts[k]).map((k) => (
          <div key={k} className={STATUS_META[k].bar} style={{ width: `${(counts[k] / total) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ORDER.map((k) => {
          const Meta = STATUS_META[k];
          return (
            <div key={k} className="rounded-lg bg-surface-muted/60 px-3 py-2">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <Meta.icon aria-hidden="true" className={`h-3.5 w-3.5 ${Meta.text}`} />
                {Meta.label}
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-ink tabular">
                {counts[k] || 0}
                <span className="ml-1 text-xs font-medium text-ink-subtle">{Math.round(((counts[k] || 0) / total) * 100)}%</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
};

export default AttendanceBreakdown;
