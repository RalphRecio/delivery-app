import { useMutation, useQueryClient } from '@tanstack/react-query';

import { walletKeys } from '@/features/wallet';
import type { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';
import type { Job, RiderProgressStatus } from '../types';

import { riderKeys } from './riderKeys';

interface ProgressJobVariables {
  id: number;
  status: RiderProgressStatus;
}

export function useProgressJob() {
  const queryClient = useQueryClient();

  return useMutation<Job, ApiError, ProgressJobVariables>({
    mutationFn: ({ id, status }) => riderApi.progressJob(id, status),
    onSuccess: async (job) => {
      queryClient.setQueryData(riderKeys.job(job.id), job);
      await queryClient.invalidateQueries({ queryKey: riderKeys.activeJob() });
      await queryClient.invalidateQueries({ queryKey: riderKeys.jobHistory() });

      // Completing a cash job deducts the commission from the wallet.
      if (job.status === 'completed') {
        await queryClient.invalidateQueries({ queryKey: walletKeys.all });
      }
    },
  });
}
