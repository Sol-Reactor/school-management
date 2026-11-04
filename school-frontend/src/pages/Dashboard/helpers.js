import { formatShortDate } from '../../lib/format';

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export const firstName = (name = '') => name.split(' ')[0];

export const trendDescription = (trend) => {
  const pts = trend?.filter((t) => t.rate != null) ?? [];
  if (pts.length < 2) return undefined;
  return `Last ${pts.length} weeks · from ${formatShortDate(pts[0].weekStart)}`;
};
