import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';
import type { Job } from '../types';

import { riderKeys } from './riderKeys';

const OFFER_REFRESH_MS = 10_000;

/**
 * Offers are pulled, not pushed, in this phase: while the rider is online
 * with a known location the list refreshes every few seconds.
 */
export function useAvailableJobs(isEnabled: boolean) {
  return useQuery<Job[], ApiError>({
    queryKey: riderKeys.availableJobs(),
    queryFn: riderApi.listAvailableJobs,
    enabled: isEnabled,
    refetchInterval: isEnabled ? OFFER_REFRESH_MS : false,
  });
}
