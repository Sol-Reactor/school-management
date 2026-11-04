// Shared formatting helpers (locale-aware, consistent across the app).

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const relativeTime = (value) => {
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day');
  return formatDate(value);
};

export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Intl.DateTimeFormat('en', opts).format(new Date(value)) : '—';

export const formatShortDate = (value) => formatDate(value, { day: 'numeric', month: 'short' });

export const formatWeekday = (value) =>
  formatDate(value, { weekday: 'short', day: 'numeric', month: 'short' });

export const percent = (n, digits = 0) => (n == null || Number.isNaN(n) ? '—' : `${n.toFixed(digits)}%`);

export const titleCase = (s = '') => s.charAt(0) + s.slice(1).toLowerCase();

export const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/** Marks out of 100 → letter band used across grades UI. */
export const gradeBand = (marks) => {
  if (marks == null) return { label: '—', tone: 'neutral' };
  if (marks >= 85) return { label: 'A', tone: 'success' };
  if (marks >= 70) return { label: 'B', tone: 'primary' };
  if (marks >= 55) return { label: 'C', tone: 'info' };
  if (marks >= 40) return { label: 'D', tone: 'warning' };
  return { label: 'F', tone: 'danger' };
};
