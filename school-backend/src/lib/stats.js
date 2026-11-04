// Pure helpers for attendance / grade statistics. Shared by the dashboards and
// the at-risk insights so both always agree on the numbers.

export const DAY_MS = 864e5;

/** "Attended" = present or late. Excused absences still count as sessions missed. */
export const ATTENDED = new Set(['PRESENT', 'LATE']);

export const startOfUtcDay = (d) => {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
};

/** Monday 00:00 UTC of the week containing `d`. */
export const weekStart = (d) => {
  const day = startOfUtcDay(d);
  const dow = (day.getUTCDay() + 6) % 7; // Mon=0
  return new Date(day.getTime() - dow * DAY_MS);
};

export const daysAgo = (n, from = new Date()) => new Date(startOfUtcDay(from).getTime() - n * DAY_MS);

const round1 = (n) => Math.round(n * 10) / 10;

/** Share of sessions attended, 0–100 (one decimal), or null with no records. */
export const attendanceRate = (records) => {
  if (!records.length) return null;
  const attended = records.filter((r) => ATTENDED.has(r.status)).length;
  return round1((attended / records.length) * 100);
};

export const average = (values) => (values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null);

/** Weekly attendance rate for the last `weeks` weeks (oldest first), including empty weeks. */
export const weeklyAttendance = (records, weeks = 8, now = new Date()) => {
  const current = weekStart(now);
  const buckets = new Map();
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(current.getTime() - i * 7 * DAY_MS);
    buckets.set(start.getTime(), []);
  }
  for (const r of records) {
    const key = weekStart(r.date).getTime();
    if (buckets.has(key)) buckets.get(key).push(r);
  }
  return [...buckets.entries()].map(([ts, recs]) => ({
    weekStart: new Date(ts).toISOString().slice(0, 10),
    rate: attendanceRate(recs),
    sessions: recs.length,
  }));
};

/** Difference in percentage points between the last `days` and the `days` before that. */
export const recentDelta = (records, days = 14, now = new Date()) => {
  const mid = daysAgo(days, now);
  const start = daysAgo(days * 2, now);
  const recent = records.filter((r) => new Date(r.date) >= mid);
  const previous = records.filter((r) => new Date(r.date) >= start && new Date(r.date) < mid);
  const a = attendanceRate(recent);
  const b = attendanceRate(previous);
  return { current: a, previous: b, delta: a != null && b != null ? round1(a - b) : null };
};

/** Mean marks per subject, highest first. */
export const subjectAverages = (grades) => {
  const by = new Map();
  for (const g of grades) {
    const name = g.subject?.name ?? 'Unknown';
    if (!by.has(name)) by.set(name, []);
    by.get(name).push(g.marks);
  }
  return [...by.entries()]
    .map(([subject, marks]) => ({ subject, average: average(marks), count: marks.length }))
    .sort((a, b) => b.average - a.average);
};

export const todayName = (now = new Date()) =>
  ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][now.getUTCDay()];
