// Friendly feedback while the Render free-tier backend cold-starts (~30–60s).
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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
      <div
        role="status"
        aria-live="polite"
        className="mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <span
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 motion-safe:animate-spin"
          style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}
        />
        <p style={{ color: 'var(--color-text)' }}>
          <strong>Waking up the server…</strong>{' '}
          <span style={{ color: 'var(--color-textSecondary)' }}>
            The free hosting tier sleeps when idle, so the first request can take up to a minute
            {seconds > 0 && ` (${seconds}s)`}.
          </span>
        </p>
      </div>
    );
  }

  if (server === 'offline') {
    return (
      <div
        role="alert"
        className="mb-6 rounded-lg border px-4 py-3 text-sm"
        style={{ borderColor: 'var(--color-error)', color: 'var(--color-text)' }}
      >
        <strong>The server isn't responding.</strong> It may be restarting.{' '}
        <button type="button" onClick={retryConnection} className="font-semibold underline">
          Try again
        </button>
      </div>
    );
  }

  return null;
};

/** Full-screen state shown by route guards while the session is being restored. */
export const ServerWakeScreen = () => {
  const { server } = useAuth();
  const seconds = useElapsedSeconds(server === 'waking');
  const waking = server === 'waking';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ backgroundColor: 'var(--color-background)' }}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className="h-10 w-10 rounded-full border-4 motion-safe:animate-spin"
        style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}
      />
      <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
        {waking ? 'Waking up the server…' : 'Loading your workspace…'}
      </p>
      {waking && (
        <p className="max-w-sm text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          Haya runs on a free hosting tier that sleeps when idle. This usually takes 30–60 seconds
          {seconds > 0 && ` (${seconds}s so far)`}.
        </p>
      )}
    </div>
  );
};
