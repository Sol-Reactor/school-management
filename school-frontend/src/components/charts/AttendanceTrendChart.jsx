// Weekly attendance rate. One series → area chart, no legend (the card title
// names it). Up to three series (e.g. a parent's children) → lines with a
// legend + end-of-line direct labels so identity is never colour-alone.
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatShortDate } from '../../lib/format';
import ChartCard from './ChartCard';

const SERIES = ['rgb(var(--chart-1))', 'rgb(var(--chart-2))', 'rgb(var(--chart-3))'];
const MAX_SERIES = 3; // validated palette: first three slots pass all-pairs CVD checks

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: 'rgb(var(--ink-subtle))', fontSize: 12 },
};

const TooltipCard = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-ink">Week of {formatShortDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-ink-muted">
          <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {payload.length > 1 && <span>{p.name}:</span>}
          <span className="font-semibold text-ink tabular">{p.value == null ? 'No sessions' : `${p.value}%`}</span>
        </p>
      ))}
    </div>
  );
};

/**
 * series: [{ key, name, data: [{ weekStart, rate }] }]
 */
const AttendanceTrendChart = ({ title = 'Attendance trend', description = 'Weekly share of sessions attended (present or late)', series, height = 240 }) => {
  const shown = series.slice(0, MAX_SERIES);
  const weeks = shown[0]?.data.map((d) => d.weekStart) ?? [];
  const rows = weeks.map((w, i) => Object.fromEntries([['weekStart', w], ...shown.map((s) => [s.key, s.data[i]?.rate ?? null])]));
  const values = rows.flatMap((r) => shown.map((s) => r[s.key])).filter((v) => v != null);
  const floor = values.length ? Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10) : 0;

  const table = {
    columns: ['Week of', ...shown.map((s) => s.name)],
    rows: rows.map((r) => [formatShortDate(r.weekStart), ...shown.map((s) => (r[s.key] == null ? '—' : `${r[s.key]}%`))]),
  };

  const common = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="0" />
      <XAxis dataKey="weekStart" tickFormatter={formatShortDate} {...axisProps} minTickGap={16} />
      <YAxis domain={[floor, 100]} tickFormatter={(v) => `${v}%`} width={44} {...axisProps} />
      <Tooltip content={<TooltipCard />} cursor={{ stroke: 'rgb(var(--line-strong))', strokeWidth: 1 }} />
    </>
  );

  return (
    <ChartCard title={title} description={description} table={table}>
      <div style={{ height }} role="img" aria-label={`${title}. ${shown.map((s) => `${s.name}: latest ${s.data.at(-1)?.rate ?? 'no data'}%`).join('; ')}. Use the Table view for exact values.`}>
        <ResponsiveContainer width="100%" height="100%">
          {shown.length === 1 ? (
            <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="att-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {common}
              <Area
                type="monotone"
                dataKey={shown[0].key}
                name={shown[0].name}
                stroke={SERIES[0]}
                strokeWidth={2}
                fill="url(#att-fill)"
                connectNulls
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'rgb(var(--surface))' }}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              {common}
              <Legend verticalAlign="top" align="right" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12, color: 'rgb(var(--ink-muted))' }} />
              {shown.map((s, i) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={SERIES[i]}
                  strokeWidth={2}
                  strokeDasharray={i === 1 ? '6 3' : i === 2 ? '2 3' : undefined}
                  connectNulls
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'rgb(var(--surface))' }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default AttendanceTrendChart;
