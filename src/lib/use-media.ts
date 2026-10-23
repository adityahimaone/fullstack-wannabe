import * as React from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
