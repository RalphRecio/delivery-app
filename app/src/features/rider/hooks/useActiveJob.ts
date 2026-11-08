import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';
import type { Job } from '../types';

import { riderKeys } from './riderKeys';

const DISPATCH_CHECK_MS = 10_000;

interface UseActiveJobOptions {
  /**
   * A dispatcher can assign a job without the rider tapping anything, so
   * while the rider is online and idle the app re-checks for one on the
   * same cadence as the offer list.
   */
  isWatchingForDispatch?: boolean;
}

export function useActiveJob({ isWatchingForDispatch = false }: UseActiveJobOptions = {}) {
  return useQuery<Job | null, ApiError>({
    queryKey: riderKeys.activeJob(),
    queryFn: riderApi.getActiveJob,
    refetchInterval: (query) =>
      isWatchingForDispatch && query.state.data === null ? DISPATCH_CHECK_MS : false,
  });
}
