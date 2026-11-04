import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LuMenu } from 'react-icons/lu';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import NotificationsMenu from './NotificationsMenu';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import DemoBanner from './DemoBanner';
import { routeLabel } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

/** Authenticated app shell: sidebar + top bar + main content. */
const Layout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Keep the document title in sync with the current section.
  useEffect(() => {
    const section = routeLabel(user?.role, `/${pathname.split('/')[1]}`);
    document.title = section ? `${section} · Haya` : 'Haya';
  }, [pathname, user?.role]);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Sidebar mobileOpen={drawerOpen} onClose={closeDrawer} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <header className="sticky top-0 z-sticky border-b border-line bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              className="-ml-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink lg:hidden"
            >
              <LuMenu aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationsMenu />
              <UserMenu />
            </div>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <div className="container-page py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
