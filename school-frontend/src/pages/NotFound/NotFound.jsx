import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuArrowLeft } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/brand/Logo';
import Button from '../../components/ui/Button';

const NotFound = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'Page not found · Haya';
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="container-page flex h-16 items-center">
        <Link to="/" className="rounded-md" aria-label="Haya home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="max-w-md text-center">
          <svg aria-hidden="true" viewBox="0 0 160 120" className="mx-auto mb-8 h-32 w-44" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="20" y="18" width="120" height="84" rx="12" fill="rgb(var(--surface))" stroke="rgb(var(--line-strong))" strokeWidth="2" />
            <path d="M20 40h120" stroke="rgb(var(--line-strong))" strokeWidth="2" />
            <circle cx="34" cy="29" r="3" fill="rgb(var(--line-strong))" />
            <circle cx="44" cy="29" r="3" fill="rgb(var(--line-strong))" />
            <path d="M58 64c6-8 14-8 20 0M82 64c6-8 14-8 20 0" stroke="rgb(var(--primary))" strokeWidth="3" />
            <path d="M66 84c8 4 20 4 28 0" stroke="rgb(var(--ink-subtle))" strokeWidth="3" />
          </svg>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-ink">404 · Page not found</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">This page skipped class</h1>
          <p className="mt-4 text-ink-muted">
            <code className="break-all rounded bg-surface-muted px-1.5 py-0.5 text-sm text-ink">{pathname}</code> doesn't exist or may have moved.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to={isAuthenticated ? '/dashboard' : '/'}>{isAuthenticated ? 'Go to dashboard' : 'Go to home page'}</Button>
            <Button variant="secondary" icon={LuArrowLeft} onClick={() => window.history.back()}>
              Go back
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
