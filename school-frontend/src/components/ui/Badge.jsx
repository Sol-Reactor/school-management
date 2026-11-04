import { cn } from '../../lib/cn';

const tones = {
  neutral: 'bg-surface-muted text-ink-muted ring-line',
  primary: 'bg-primary-soft text-primary-ink ring-primary/20',
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/25',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  info: 'bg-info-soft text-info ring-info/20',
  accent: 'bg-accent-soft text-accent ring-accent/25',
};

/** Status pill. Always carries text (and optionally an icon) — never colour alone. */
const Badge = ({ tone = 'neutral', icon: Icon, className, children }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
      tones[tone],
      className
    )}
  >
    {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5" />}
    {children}
  </span>
);

export default Badge;
