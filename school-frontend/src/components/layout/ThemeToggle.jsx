import { LuMoon, LuSun } from 'react-icons/lu';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/cn';

const ThemeToggle = ({ className }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors duration-fast hover:bg-surface-muted hover:text-ink',
        className
      )}
    >
      {dark ? <LuSun aria-hidden="true" className="h-5 w-5" /> : <LuMoon aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
