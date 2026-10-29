import * as React from 'react';
import { readStore, writeStore } from '@/lib/storage';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/** Brand paper, not a neutral grey. Keep in sync with wannabe-tokens.css. */
const THEME_COLOR: Record<Theme, string> = {
  light: '#FFF6E5',
  dark: '#171226',
};

/**
 * The brand ships cream paper as the default ground — that is the identity,
 * and dark is the alternate. A returning user's choice still wins.
 */
const DEFAULT_THEME: Theme = 'light';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    readStore<Theme>('theme', DEFAULT_THEME),
  );

  React.useEffect(() => {
    const root = document.documentElement;
    // `.dark` drives Tailwind; `data-theme` drives the token file. Set both
    // so the two never drift apart.
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    writeStore('theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggle: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
