/** @type {import('tailwindcss').Config} */
// Haya design tokens. Colours are CSS variables (RGB channels) defined in
// src/index.css for light and dark, so every utility supports opacity
// (e.g. bg-primary/10) and themes switch without re-rendering.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'), // app background
        surface: { DEFAULT: token('surface'), muted: token('surface-muted'), raised: token('surface-raised') },
        line: { DEFAULT: token('line'), strong: token('line-strong'), input: token('input') },
        ink: { DEFAULT: token('ink'), muted: token('ink-muted'), subtle: token('ink-subtle'), inverse: token('ink-inverse') },
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          soft: token('primary-soft'),
          ink: token('primary-ink'), // primary-coloured text on surfaces
          on: token('on-primary'), // text on a primary background
        },
        accent: { DEFAULT: token('accent'), soft: token('accent-soft') },
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
        chart: { 1: token('chart-1'), 2: token('chart-2'), 3: token('chart-3'), grid: token('chart-grid') },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      // Type scale (rem → follows the user's text-size preference).
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.015em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '6xl': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(var(--shadow) / 0.05)',
        sm: '0 1px 3px 0 rgb(var(--shadow) / 0.08), 0 1px 2px -1px rgb(var(--shadow) / 0.06)',
        md: '0 4px 12px -2px rgb(var(--shadow) / 0.10), 0 2px 4px -2px rgb(var(--shadow) / 0.06)',
        lg: '0 12px 32px -8px rgb(var(--shadow) / 0.18), 0 4px 8px -4px rgb(var(--shadow) / 0.08)',
        focus: '0 0 0 3px rgb(var(--focus) / 0.45)',
      },
      zIndex: {
        dropdown: '20',
        sticky: '30',
        overlay: '40',
        modal: '50',
        toast: '60',
      },
      transitionDuration: { fast: '150ms', DEFAULT: '200ms', slow: '250ms' },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)',
        out: 'cubic-bezier(0.16, 1, 0.3, 1)', // entering
        in: 'cubic-bezier(0.7, 0, 0.84, 0)', // exiting
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s infinite',
      },
      maxWidth: { content: '80rem' },
    },
  },
  plugins: [],
};
