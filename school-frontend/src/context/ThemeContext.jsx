/* eslint-disable react-refresh/only-export-components -- context module exports its hook alongside the provider */
// Appearance preferences: theme (light / dark / system), text size and reduced motion.
// Persisted per browser; applied to <html> data attributes that index.css reads.
// index.html applies the same values before first paint to avoid a flash.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'haya:prefs';
const DEFAULTS = { theme: 'system', textSize: 'default', reduceMotion: false };

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

const readPrefs = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export const ThemeProvider = ({ children }) => {
  const [prefs, setPrefs] = useState(readPrefs);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Follow OS changes while on "system".
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    if (prefs.textSize === 'default') delete root.dataset.textSize;
    else root.dataset.textSize = prefs.textSize;
    if (prefs.reduceMotion) root.dataset.reduceMotion = 'true';
    else delete root.dataset.reduceMotion;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage may be unavailable (private mode); preferences still apply for this session.
    }
  }, [prefs, resolvedTheme]);

  const setPreference = useCallback((key, value) => setPrefs((p) => ({ ...p, [key]: value })), []);

  const value = useMemo(
    () => ({
      ...prefs,
      resolvedTheme,
      setTheme: (theme) => setPreference('theme', theme),
      toggleTheme: () => setPreference('theme', resolvedTheme === 'dark' ? 'light' : 'dark'),
      setPreference,
      resetPreferences: () => setPrefs(DEFAULTS),
    }),
    [prefs, resolvedTheme, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
