import { Link, useLocation } from 'react-router-dom';
import { LuChevronRight } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { routeLabel } from '../../config/navigation';
import { useBreadcrumbLabel } from './breadcrumbStore';

/** Home › Section › Detail. Detail pages register their own label (e.g. a student's name). */
const Breadcrumbs = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const detailLabel = useBreadcrumbLabel();

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ to: '/dashboard', label: 'Home' }];
  if (segments[0] && segments[0] !== 'dashboard') {
    const section = `/${segments[0]}`;
    crumbs.push({ to: section, label: routeLabel(user?.role, section) ?? segments[0] });
  }
  if (segments[1]) crumbs.push({ to: pathname, label: detailLabel ?? 'Details' });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.to} className="flex min-w-0 items-center gap-1">
              {i > 0 && <LuChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-subtle" />}
              {last ? (
                <span aria-current="page" className="truncate font-semibold text-ink">
                  {c.label}
                </span>
              ) : (
                <Link to={c.to} className="truncate rounded text-ink-muted transition-colors duration-fast hover:text-ink">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
