import { cn } from '../../lib/cn';

/** Haya mark: an open book whose spine forms the bar of an "H". */
export const LogoMark = ({ className }) => (
  <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('h-8 w-8 shrink-0', className)}>
    <rect width="64" height="64" rx="14" fill="rgb(var(--primary))" />
    <path d="M14 18c6-2 12-1 16 3v26c-4-4-10-5-16-3z" fill="rgb(var(--on-primary))" fillOpacity="0.78" />
    <path d="M50 18c-6-2-12-1-16 3v26c4-4 10-5 16-3z" fill="rgb(var(--on-primary))" />
    <path d="M19 31h8M37 31h8" stroke="rgb(var(--primary))" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Logo = ({ className, textClassName }) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <LogoMark />
    <span className={cn('text-lg font-bold tracking-tight text-ink', textClassName)}>Haya</span>
  </span>
);

export default Logo;
