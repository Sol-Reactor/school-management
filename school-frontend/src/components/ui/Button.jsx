import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import Spinner from './Spinner';

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold ' +
  'transition-colors duration-fast ease-out cursor-pointer ' +
  'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55';

const variants = {
  primary: 'bg-primary text-primary-on shadow-xs hover:bg-primary-hover',
  secondary: 'border border-line-input bg-surface text-ink shadow-xs hover:bg-surface-muted',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  soft: 'bg-primary-soft text-primary-ink hover:bg-primary/15',
  danger: 'bg-danger text-white shadow-xs hover:bg-danger/90 dark:text-canvas',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
};

// Heights keep touch targets >= 40px (md) / 44px (lg).
const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
  'icon-sm': 'h-9 w-9',
};

/**
 * Button. Pass `to` to render a router Link, `href` for an external anchor.
 * Icon-only buttons (size="icon") must have an aria-label.
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, loadingText, icon: Icon, iconRight: IconRight, className, children, to, href, disabled, type = 'button', ...props },
  ref
) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {loading ? <Spinner className="h-4 w-4" /> : Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />}
      {loading && loadingText ? loadingText : children}
      {!loading && IconRight && <IconRight aria-hidden="true" className="h-4 w-4 shrink-0" />}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
