import { useLocation } from 'react-router-dom';

/**
 * Four worlds, one hat each. The hat is the only variable in the mark —
 * the header strip — so the logo tells you where you are before you read
 * a single word. This is the signature of the whole identity.
 */
export type World = 'home' | 'schema' | 'arena' | 'dojo' | 'blueprint';

export const WORLD_HAT: Record<World, string> = {
  home: 'var(--mango)',
  schema: 'var(--cyan)',
  arena: 'var(--pink)',
  dojo: 'var(--lime)',
  blueprint: 'var(--grape)',
};

/** The matching *ink* variant, for text and icons that sit on paper. */
export const WORLD_INK: Record<World, string> = {
  home: 'var(--mango-ink)',
  schema: 'var(--cyan-ink)',
  arena: 'var(--destructive)',
  dojo: 'var(--lime-ink)',
  blueprint: 'var(--grape-ink)',
};

/**
 * What to put ON the hat. Fixed values, not theme-flipping ones: grape is the
 * only hat dark enough to need paper text — ink on grape is 3.28:1 and fails.
 */
export const WORLD_ON: Record<World, string> = {
  home: 'var(--on-candy)',
  schema: 'var(--on-candy)',
  arena: 'var(--on-candy)',
  dojo: 'var(--on-candy)',
  blueprint: 'var(--on-grape)',
};

export const WORLD_LABEL: Record<World, string> = {
  home: 'Overview',
  schema: 'Schema Studio',
  arena: 'Query Arena',
  dojo: 'Polyglot Dojo',
  blueprint: 'API Blueprint',
};

const ROUTE_WORLD: Record<string, World> = {
  '/': 'home',
  '/erd': 'schema',
  '/sql': 'arena',
  '/dojo': 'dojo',
  '/blueprint': 'blueprint',
};

export function worldForPath(pathname: string): World {
  const exact = ROUTE_WORLD[pathname];
  if (exact) return exact;
  const prefix = Object.keys(ROUTE_WORLD).find((p) => p !== '/' && pathname.startsWith(p));
  return prefix ? ROUTE_WORLD[prefix] : 'home';
}

/** The current world, derived from the router. */
export function useWorld(): World {
  return worldForPath(useLocation().pathname);
}
