import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotFound = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-16"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-md text-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 120 120"
          className="mx-auto mb-8 h-28 w-28"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="60" cy="60" r="52" stroke="var(--color-border)" />
          <path d="M38 44h44v40H38z" stroke="var(--color-primary)" />
          <path d="M60 44v40M38 52c8-6 14-6 22 0 8-6 14-6 22 0" stroke="var(--color-primary)" />
          <path d="M84 84l14 14" stroke="var(--color-textSecondary)" />
          <circle cx="78" cy="78" r="10" stroke="var(--color-textSecondary)" />
        </svg>

        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
          404 · Page not found
        </p>
        <h1 className="mt-3 text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          We couldn't find that page
        </h1>
        <p className="mt-4" style={{ color: 'var(--color-textSecondary)' }}>
          <code className="break-all rounded px-1.5 py-0.5 text-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
            {pathname}
          </code>{' '}
          doesn't exist or may have moved.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="rounded-lg px-5 py-2.5 font-semibold text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isAuthenticated ? 'Go to dashboard' : 'Go to home page'}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border px-5 py-2.5 font-semibold transition-colors duration-200"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Go back
          </button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
