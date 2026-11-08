import { useEffect } from 'react';

import { riderApi } from '../api/riderApi';

/** Matches the server's presence timeout of 150 s with two beats of slack. */
export const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * While the rider is online and the app is open, tell the server every
 * minute. Customers count a rider as on duty only while these arrive, so
 * closing the app takes the rider off the count within a few minutes.
 * A failed beat is ignored on purpose: the next one retries, and a rider
 * should never see an error just because one ping was lost.
 */
export function useRiderHeartbeat(isOnline: boolean): void {
  useEffect(() => {
    if (!isOnline) {
      return undefined;
    }

    const beat = () => {
      riderApi.heartbeat().catch(() => undefined);
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isOnline]);
}
