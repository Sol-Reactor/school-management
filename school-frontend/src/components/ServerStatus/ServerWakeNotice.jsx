// Friendly feedback while the Render free-tier backend cold-starts (~30–60s).
import { useEffect, useState } from 'react';
import { LuServerCog } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';
import { LogoMark } from '../brand/Logo';

const useElapsedSeconds = (running) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => {
      clearInterval(id);
      setSeconds(0);
    };
  }, [running]);
  return seconds;
};

/** Inline banner for forms (login/register) — renders nothing when the server is ready. */
export const ServerWakeBanner = () => {
  const { server, retryConnection } = useAuth();
  const seconds = useElapsedSeconds(server === 'waking');

  if (server === 'waking') {
    return (
      <div role="status" aria-live="polite" className="mb-6 flex items-start gap-3 rounded-xl border border-info/25 bg-info-soft px-4 py-3 text-sm">
        <Spinner className="mt-0.5 h-4 w-4 text-info" />
        <p className="text-ink">
          <strong className="font-semibold">Waking up the server…</strong>{' '}
          <span className="text-ink-muted">
            Haya's free hosting tier sleeps when idle, so the first request can take up to a minute
            {seconds > 0 && <span className="tabular"> ({seconds}s)</span>}.
          </span>
        </p>
      </div>
    );
  }

  if (server === 'offline') {
    return (
      <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-ink">
        <LuServerCog aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        <p>
          <strong className="font-semibold">The server isn't responding.</strong> It may be restarting.{' '}
          <button type="button" onClick={retryConnection} className="cursor-pointer rounded font-semibold text-primary-ink underline">
            Try again
          </button>
        </p>
      </div>
    );
  }

  return null;
};

/** Full-screen state shown by route guards while the session is being restored. */
export const ServerWakeScreen = () => {
  const { server } = useAuth();
  const waking = server === 'waking';
  const seconds = useElapsedSeconds(waking);

  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
      <LogoMark className="h-12 w-12" />
      <Spinner className="h-6 w-6 text-primary-ink" />
      <div>
        <p className="text-lg font-semibold text-ink">{waking ? 'Waking up the server…' : 'Loading your workspace…'}</p>
        {waking && (
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Haya runs on a free hosting tier that sleeps when idle. This usually takes 30–60 seconds
            {seconds > 0 && <span className="tabular"> ({seconds}s so far)</span>}.
          </p>
        )}
      </div>
    </div>
  );
};
