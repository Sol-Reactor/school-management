import { Link, Navigate } from 'react-router-dom';
import { LuCircleCheck } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/brand/Logo';
import HeroIllustration from '../../components/brand/HeroIllustration';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { ServerWakeBanner } from '../../components/ServerStatus/ServerWakeNotice';

const POINTS = [
  'Registers in under a minute, on any device',
  'Grades, timetables and attendance in one place',
  'A dedicated view for admins, teachers, students and parents',
];

/** Split layout for sign-in / sign-up. Redirects signed-in users to their dashboard. */
const AuthLayout = ({ title, subtitle, children, footer }) => {
  const { status } = useAuth();
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;

  return (
    <div className="grid grid-cols-1 min-h-dvh bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface-muted/50 p-10 lg:flex">
        <Link to="/" className="self-start rounded-md" aria-label="Haya home">
          <Logo />
        </Link>
        <div>
          <HeroIllustration className="mx-auto w-full max-w-md" />
          <ul className="mx-auto mt-10 max-w-md space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-ink-muted">
                <LuCircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary-ink" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-ink-subtle">© {new Date().getFullYear()} Haya · Built as a portfolio project</p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="rounded-md lg:invisible" aria-label="Haya home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
          <div className="mt-6">
            <ServerWakeBanner />
          </div>
          {children}
          {footer && <div className="mt-8 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
