import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { walletApi } from '../api/walletApi';
import type { TopupRequest } from '../types';

import { walletKeys } from './walletKeys';

export function useCreateTopup() {
  const queryClient = useQueryClient();

  return useMutation<TopupRequest, ApiError, { amount: string; returnUrl: string }>({
    mutationFn: ({ amount, returnUrl }) => walletApi.createTopup(amount, returnUrl),
    onSuccess: (topup) => queryClient.setQueryData(walletKeys.topup(topup.id), topup),
  });
}
