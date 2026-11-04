// "Try the demo" — one-click sign-in to a seeded, read-only account per role.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowRight, LuPresentation, LuGraduationCap, LuShieldCheck, LuUsers } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { cn } from '../../lib/cn';
import Spinner from '../ui/Spinner';

const DEMO_ROLES = [
  { role: 'ADMIN', label: 'Administrator', blurb: 'School-wide KPIs, classes and staff', icon: LuShieldCheck },
  { role: 'TEACHER', label: 'Teacher', blurb: 'Registers, gradebooks, timetable', icon: LuPresentation },
  { role: 'STUDENT', label: 'Student', blurb: 'My grades, attendance and lessons', icon: LuGraduationCap },
  { role: 'PARENT', label: 'Parent', blurb: "Two children's progress at a glance", icon: LuUsers },
];

const DemoPicker = ({ variant = 'grid', className }) => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pending) return undefined;
    const t = setTimeout(() => setSlow(true), 3000);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [pending]);

  const start = async (role) => {
    setPending(role);
    setError(null);
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'The demo is unavailable right now. Please try again shortly.'));
      setPending(null);
    }
  };

  return (
    <div className={className}>
      <ul className={cn('grid gap-2', variant === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1')}>
        {DEMO_ROLES.map(({ role, label, blurb, icon: Icon }) => (
          <li key={role}>
            <button
              type="button"
              onClick={() => start(role)}
              disabled={!!pending}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors duration-fast hover:border-primary/50 hover:bg-primary-soft/40 disabled:cursor-wait disabled:opacity-70"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-ink">
                {pending === role ? <Spinner className="h-5 w-5" /> : <Icon aria-hidden="true" className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  <span className="sr-only">Try the demo as </span>
                  {label}
                </span>
                <span className="block truncate text-xs text-ink-subtle">{blurb}</span>
              </span>
              <LuArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-fast group-hover:translate-x-0.5" />
            </button>
          </li>
        ))}
      </ul>
      <div aria-live="polite" className="mt-2 min-h-5 text-sm">
        {pending && slow && <p className="text-ink-muted">Waking up the server — the free tier can take up to a minute…</p>}
        {error && <p role="alert" className="text-danger">{error}</p>}
      </div>
    </div>
  );
};

export default DemoPicker;
