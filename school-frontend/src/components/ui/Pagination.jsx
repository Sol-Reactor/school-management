import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { cn } from '../../lib/cn';

/** Compact page list with ellipses: 1 … 4 5 6 … 12 */
const pagesToShow = (page, count) => {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, page - 1, page, page + 1]);
  const list = [...set].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  return list.flatMap((p, i) => (i > 0 && p - list[i - 1] > 1 ? ['…', p] : [p]));
};

const btn =
  'inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-40';

const Pagination = ({ page, pageCount, onChange }) => (
  <nav aria-label="Pagination" className="flex items-center gap-1">
    <button type="button" className={cn(btn, 'text-ink-muted hover:bg-surface-muted')} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
      <LuChevronLeft aria-hidden="true" className="h-4 w-4" />
    </button>
    {pagesToShow(page, pageCount).map((p, i) =>
      p === '…' ? (
        <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-subtle">
          …
        </span>
      ) : (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p}`}
          className={cn(btn, p === page ? 'bg-primary text-primary-on' : 'text-ink-muted hover:bg-surface-muted')}
        >
          {p}
        </button>
      )
    )}
    <button type="button" className={cn(btn, 'text-ink-muted hover:bg-surface-muted')} onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
      <LuChevronRight aria-hidden="true" className="h-4 w-4" />
    </button>
  </nav>
);

export default Pagination;
