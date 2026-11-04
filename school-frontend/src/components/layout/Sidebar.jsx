// Primary navigation. Static column on lg+, slide-in drawer below that
// (focus moves into the drawer, Escape / backdrop / navigation close it).
import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LuX } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { ACCOUNT_NAV, navForRole, ROLE_LABEL } from '../../config/navigation';
import { cn } from '../../lib/cn';
import Logo from '../brand/Logo';

const NavItem = ({ item, onNavigate }) => (
  <li>
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-fast',
          isActive ? 'bg-primary-soft text-primary-ink' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
          <item.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          {item.label}
        </>
      )}
    </NavLink>
  </li>
);

const SidebarContent = ({ onNavigate }) => {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link to="/dashboard" onClick={onNavigate} className="rounded-md" aria-label="Haya — go to dashboard">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          {ROLE_LABEL[user?.role] ?? 'Menu'}
        </p>
        <ul className="space-y-0.5">
          {navForRole(user?.role).map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </ul>
        <p className="mt-6 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">Account</p>
        <ul className="space-y-0.5">
          {ACCOUNT_NAV.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </ul>
      </nav>
      <p className="border-t border-line px-5 py-4 text-xs text-ink-subtle">Haya · School workspace</p>
    </div>
  );
};

const Sidebar = ({ mobileOpen, onClose }) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previously = document.activeElement;
    drawerRef.current?.querySelector('a, button')?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previously?.focus?.();
    };
  }, [mobileOpen, onClose]);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-overlay lg:hidden">
          <div aria-hidden="true" className="absolute inset-0 animate-fade-in bg-ink/40 dark:bg-black/60" onClick={onClose} />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative h-full w-72 max-w-[85vw] animate-slide-in-left border-r border-line bg-surface shadow-lg"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="absolute right-3 top-3.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink"
            >
              <LuX aria-hidden="true" className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
