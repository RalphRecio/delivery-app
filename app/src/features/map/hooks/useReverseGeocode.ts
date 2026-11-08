import { useEffect, useState } from 'react';

import { reverseGeocode } from '../lib/reverseGeocode';
import type { LatLng } from '../types';

const DEBOUNCE_MS = 700;

/**
 * Turns the pin's position into an address line, a moment after the pin
 * stops moving. `null` means unknown; `undefined` means not asked yet.
 */
export function useReverseGeocode(point: LatLng | null) {
  const [address, setAddress] = useState<string | null>();
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (point === null) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsResolving(true);
      reverseGeocode(point, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setAddress(result);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setAddress(null);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsResolving(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [point]);

  return { address, isResolving };
}
