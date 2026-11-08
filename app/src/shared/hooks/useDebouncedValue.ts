import { useEffect, useState } from 'react';

const DEFAULT_DELAY_MS = 300;

/** The value as it was once it stopped changing for `delayMs`; for search boxes that query the server. */
export function useDebouncedValue<T>(value: T, delayMs = DEFAULT_DELAY_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
