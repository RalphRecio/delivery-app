import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';
import type { Job } from '../types';

import { riderKeys } from './riderKeys';

export function useAcceptJob() {
  const queryClient = useQueryClient();

  return useMutation<Job, ApiError, number>({
    mutationFn: riderApi.acceptJob,
    onSettled: async (job) => {
      if (job !== undefined) {
        queryClient.setQueryData(riderKeys.job(job.id), job);
        queryClient.setQueryData(riderKeys.activeJob(), job);
      }

      // Whether we won or lost the race, the offer list is out of date.
      await queryClient.invalidateQueries({ queryKey: riderKeys.availableJobs() });
    },
  });
}
