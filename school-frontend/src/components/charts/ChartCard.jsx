import { useId, useState } from 'react';
import { LuChartLine, LuTable } from 'react-icons/lu';
import { Card, CardHeader } from '../ui/Card';
import { cn } from '../../lib/cn';

/**
 * Card wrapper for a chart with an accessible table alternative.
 * `table` is { columns: string[], rows: (string|number)[][] }.
 */
const ChartCard = ({ title, description, table, children, actions, className }) => {
  const [view, setView] = useState('chart');
  const id = useId();

  const toggle = table && (
    <div role="group" aria-label={`${title}: display as`} className="inline-flex rounded-lg border border-line p-0.5">
      {[
        { key: 'chart', label: 'Chart', icon: LuChartLine },
        { key: 'table', label: 'Table', icon: LuTable },
      ].map((opt) => (
        <button
          key={opt.key}
          type="button"
          aria-pressed={view === opt.key}
          onClick={() => setView(opt.key)}
          className={cn(
            'inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors duration-fast',
            view === opt.key ? 'bg-surface-muted text-ink' : 'text-ink-subtle hover:text-ink'
          )}
        >
          <opt.icon aria-hidden="true" className="h-3.5 w-3.5" />
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <Card className={className} aria-labelledby={id}>
      <CardHeader id={id} title={title} description={description} actions={<>{actions}{toggle}</>} />
      <div className="p-5">
        {view === 'table' && table ? (
          <div className="relative overflow-x-auto rounded-b-xl focus-visible:outline-offset-[-2px]" role="region" aria-label={`${title} (table)`} tabIndex={0}>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b border-line">
                  {table.columns.map((c, i) => (
                    <th key={c} scope="col" className={cn('pb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle', i > 0 && 'text-right')}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {table.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, i) => (
                      <td key={i} className={cn('py-2 text-ink-muted', i > 0 && 'text-right tabular')}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
};

export default ChartCard;
