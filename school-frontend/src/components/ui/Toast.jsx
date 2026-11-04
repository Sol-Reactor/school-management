import { useEffect, useRef, useState } from 'react';
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from 'react-icons/lu';
import { cn } from '../../lib/cn';

const tones = {
  success: { icon: LuCircleCheck, cls: 'text-success' },
  error: { icon: LuCircleAlert, cls: 'text-danger' },
  info: { icon: LuInfo, cls: 'text-info' },
};

/** A single toast. Pauses its timer while hovered or focused so it can be read. */
const Toast = ({ message, type = 'success', duration = 4000, onClose }) => {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const { icon: Icon, cls } = tones[type] ?? tones.info;

  useEffect(() => {
    if (!duration || paused) return undefined;
    const started = Date.now();
    const timer = setTimeout(onClose, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [duration, paused, onClose]);

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full animate-pop-in items-start gap-3 rounded-xl border border-line bg-surface-raised p-4 shadow-lg sm:w-96"
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 h-5 w-5 shrink-0', cls)} />
      <p className="flex-1 text-sm font-medium text-ink">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="-m-1 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-subtle transition-colors duration-fast hover:bg-surface-muted hover:text-ink"
      >
        <LuX aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
