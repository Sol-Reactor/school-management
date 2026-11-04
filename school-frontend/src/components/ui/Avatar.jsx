import { useState } from 'react';
import { cn } from '../../lib/cn';

const sizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' };

// Deterministic, AA-contrast background per name so avatars are stable and distinguishable.
const palettes = [
  'bg-primary-soft text-primary-ink',
  'bg-info-soft text-info',
  'bg-accent-soft text-accent',
  'bg-success-soft text-success',
  'bg-danger-soft text-danger',
];

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

const hash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Shows the image when it loads, otherwise initials. `name` doubles as alt text. */
const Avatar = ({ name, src, size = 'md', className, decorative = false }) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold',
        !showImage && palettes[hash(name) % palettes.length],
        sizes[size],
        className
      )}
      role={decorative || showImage ? undefined : 'img'}
      aria-label={decorative || showImage ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      {showImage ? (
        <img src={src} alt={decorative ? '' : name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
};

export default Avatar;
