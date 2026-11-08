import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';
import type { RiderProfile } from '../types';

import { riderKeys } from './riderKeys';

export function useRiderProfile() {
  return useQuery<RiderProfile, ApiError>({
    queryKey: riderKeys.profile(),
    queryFn: riderApi.getProfile,
  });
}
