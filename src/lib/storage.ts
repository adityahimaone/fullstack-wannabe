import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'fsw:';

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / private mode — fail silently, app still works in-memory */
  }
}

/** localStorage-backed state that survives reloads. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStore(key, initial));
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    writeStore(key, value);
  }, [key, value]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, reset] as const;
}
