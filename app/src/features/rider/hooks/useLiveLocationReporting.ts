import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getCurrentPosition } from '@/features/map';

import { riderApi } from '../api/riderApi';

import { riderKeys } from './riderKeys';

/** How often the rider's position is sent during a job; the customer map polls every 10 s. */
export const LOCATION_REPORT_INTERVAL_MS = 15_000;

/**
 * While the rider has a job in progress, read the device position and send
 * it every 15 s so the customer can follow them on the map. Throttled on
 * purpose: often enough to look live, rare enough to spare the battery and
 * the server. A failed read or send is skipped; the next tick retries.
 */
export function useLiveLocationReporting(hasActiveJob: boolean): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasActiveJob) {
      return undefined;
    }

    let isCancelled = false;

    const report = async () => {
      try {
        const position = await getCurrentPosition();

        if (isCancelled) {
          return;
        }

        const profile = await riderApi.updateLocation(position);
        queryClient.setQueryData(riderKeys.profile(), profile);
      } catch {
        // Permission denied, no fix, or offline: try again on the next tick.
      }
    };

    void report();
    const timer = setInterval(() => void report(), LOCATION_REPORT_INTERVAL_MS);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [hasActiveJob, queryClient]);
}
