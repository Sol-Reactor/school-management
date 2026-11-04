// Ranked horizontal bars in one hue (magnitude comparison, largest first).
// Plain HTML/CSS rather than a chart library: crisp at any width, every value
// directly labelled, and natively readable by screen readers as a list.
import ChartCard from './ChartCard';

const RankedBars = ({ title, description, items, valueLabel = (v) => v, max = 100, emptyText = 'No data yet.' }) => {
  const table = {
    columns: ['Name', 'Value'],
    rows: items.map((i) => [i.label, valueLabel(i.value)]),
  };

  return (
    <ChartCard title={title} description={description} table={table}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-subtle">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.label} className="group">
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-ink">{item.label}</span>
                <span className="shrink-0 font-semibold text-ink tabular">{valueLabel(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-surface-muted" aria-hidden="true">
                <div
                  className="h-full rounded bg-chart-1 transition-[width] duration-slow ease-out"
                  style={{ width: `${Math.max(2, Math.min(100, (item.value / max) * 100))}%` }}
                />
              </div>
              {item.hint && <p className="mt-1 text-xs text-ink-subtle">{item.hint}</p>}
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
};

export default RankedBars;
