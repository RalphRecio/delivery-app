import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';
import type { LocationInput, RiderProfile } from '../types';

import { riderKeys } from './riderKeys';

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation<RiderProfile, ApiError, LocationInput>({
    mutationFn: riderApi.updateLocation,
    onSuccess: async (profile) => {
      queryClient.setQueryData(riderKeys.profile(), profile);
      await queryClient.invalidateQueries({ queryKey: riderKeys.availableJobs() });
    },
  });
}
