// Client-side data table: search, column sort, toolbar filters, pagination,
// skeleton loading, empty and "no results" states. Sorting is exposed to
// assistive tech via aria-sort; result counts are announced politely.
import { useDeferredValue, useId, useMemo, useState } from 'react';
import { LuArrowDown, LuArrowUp, LuArrowUpDown, LuSearch, LuSearchX } from 'react-icons/lu';
import { cn } from '../../lib/cn';
import Button from './Button';
import EmptyState from './EmptyState';
import { Input } from './Field';
import Pagination from './Pagination';
import { TableSkeleton } from './Skeleton';

const hideClass = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };

const compare = (a, b) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date || b instanceof Date) return new Date(a) - new Date(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

const DataTable = ({
  caption,
  columns,
  rows = [],
  getRowId = (r) => r.id,
  loading = false,
  error,
  onRetry,
  searchText, // (row) => string; enables the search box
  searchPlaceholder = 'Search…',
  toolbar,
  emptyState,
  initialSort,
  pageSize = 10,
  className,
}) => {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q || !searchText) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(q));
  }, [rows, deferredQuery, searchText]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return filtered;
    const dir = sort.dir === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => dir * compare(col.sortValue(a), col.sortValue(b)));
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (id) => {
    setPage(1);
    setSort((s) => (s?.id !== id ? { id, dir: 'asc' } : s.dir === 'asc' ? { id, dir: 'desc' } : null));
  };

  const hasRows = rows.length > 0;
  const noResults = hasRows && sorted.length === 0;

  return (
    <div className={cn('card relative overflow-hidden', className)}>
      {(searchText || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          {searchText && (
            <div className="w-full sm:max-w-xs">
              <label className="sr-only" htmlFor={searchId}>
                Search {caption}
              </label>
              <Input
                id={searchId}
                type="search"
                icon={LuSearch}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{toolbar}</div>}
        </div>
      )}

      {loading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Loading {caption}…</span>
          <TableSkeleton columns={Math.min(columns.length, 4)} />
        </div>
      ) : error ? (
        <EmptyState
          title="Couldn't load this list"
          description={error}
          action={onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
        />
      ) : !hasRows ? (
        emptyState
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-b-xl focus-visible:outline-offset-[-2px]" role="region" aria-label={caption} tabIndex={0}>
            <table className="w-full border-collapse text-left text-sm sm:min-w-[36rem]">
              <caption className="sr-only">
                {caption}
                {sort && `, sorted by ${columns.find((c) => c.id === sort.id)?.header} ${sort.dir === 'asc' ? 'ascending' : 'descending'}`}
              </caption>
              <thead className="bg-surface-muted/60">
                <tr>
                  {columns.map((col) => {
                    const active = sort?.id === col.id;
                    const SortIcon = !active ? LuArrowUpDown : sort.dir === 'asc' ? LuArrowUp : LuArrowDown;
                    return (
                      <th
                        key={col.id}
                        scope="col"
                        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : col.sortValue ? 'none' : undefined}
                        className={cn(
                          'whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle',
                          col.align === 'right' && 'text-right',
                          col.hideBelow && hideClass[col.hideBelow],
                          col.headerClassName
                        )}
                      >
                        {col.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.id)}
                            className={cn(
                              '-mx-1 inline-flex cursor-pointer items-center gap-1 rounded px-1 uppercase transition-colors duration-fast hover:text-ink',
                              active && 'text-ink'
                            )}
                          >
                            {col.header}
                            <SortIcon aria-hidden="true" className={cn('h-3.5 w-3.5', !active && 'opacity-50')} />
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((row) => (
                  <tr key={getRowId(row)} className="transition-colors duration-fast hover:bg-surface-muted/40">
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          'px-5 py-3 align-middle text-ink-muted',
                          col.align === 'right' && 'text-right tabular',
                          col.hideBelow && hideClass[col.hideBelow],
                          col.className
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {noResults && (
            <EmptyState
              compact
              icon={LuSearchX}
              title="No matches"
              description={`Nothing matches “${query}”. Try a different search or clear the filters.`}
              action={<Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button>}
            />
          )}

          <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-3 sm:flex-row">
            <p className="text-sm text-ink-subtle" aria-live="polite">
              {sorted.length === 0
                ? 'No results'
                : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, sorted.length)} of ${sorted.length}`}
            </p>
            {pageCount > 1 && <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />}
          </div>
        </>
      )}
    </div>
  );
};

export default DataTable;
