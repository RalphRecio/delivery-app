import { useCallback, useState } from 'react';

import { getCurrentPosition } from '../lib/getCurrentPosition';
import type { LatLng } from '../types';

/** "Use my location": asks the device once per tap, reports progress and errors. */
export function useCurrentPosition() {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string>();

  const locate = useCallback(async (): Promise<LatLng | null> => {
    setIsLocating(true);
    setError(undefined);

    try {
      return await getCurrentPosition();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not get your location.');

      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  return { locate, isLocating, error };
}
