import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';
import type { RiderProfile } from '../types';

import { riderKeys } from './riderKeys';

export function useSetAvailability() {
  const queryClient = useQueryClient();

  return useMutation<RiderProfile, ApiError, boolean>({
    mutationFn: riderApi.setAvailability,
    onSuccess: async (profile) => {
      queryClient.setQueryData(riderKeys.profile(), profile);
      await queryClient.invalidateQueries({ queryKey: riderKeys.availableJobs() });
    },
  });
}
