import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { customerApi } from '../api/customerApi';
import type { RidersOnDuty } from '../types';

import { customerKeys } from './customerKeys';

const REFRESH_MS = 30_000;

export function useRidersOnDuty() {
  return useQuery<RidersOnDuty, ApiError>({
    queryKey: customerKeys.ridersOnDuty(),
    queryFn: customerApi.getRidersOnDuty,
    refetchInterval: REFRESH_MS,
  });
}
