// Client-side mirrors of the API's stats (school-backend/src/lib/stats.js) for
// pages that already have raw records. Attendance rate = (present + late) / sessions.
const ATTENDED = new Set(['PRESENT', 'LATE']);
const DAY = 864e5;

const weekStart = (d) => {
  const x = new Date(d);
  const day = Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
  const dow = (new Date(day).getUTCDay() + 6) % 7;
  return day - dow * DAY;
};

export const attendanceRate = (records) =>
  records.length ? Math.round((records.filter((r) => ATTENDED.has(r.status)).length / records.length) * 1000) / 10 : null;

export const weeklyAttendance = (records, weeks = 8) => {
  const current = weekStart(new Date());
  return Array.from({ length: weeks }, (_, i) => {
    const start = current - (weeks - 1 - i) * 7 * DAY;
    const recs = records.filter((r) => weekStart(r.date) === start);
    return { weekStart: new Date(start).toISOString().slice(0, 10), rate: attendanceRate(recs) };
  });
};

export const average = (nums) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null);

export const subjectAverages = (grades) => {
  const by = new Map();
  for (const g of grades) {
    const name = g.subject?.name ?? 'Unknown';
    by.set(name, [...(by.get(name) ?? []), g.marks]);
  }
  return [...by.entries()].map(([subject, marks]) => ({ subject, average: average(marks), count: marks.length })).sort((a, b) => b.average - a.average);
};
