import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { ApiError } from '@/shared/lib/api';

import { walletApi } from '../api/walletApi';
import type { TopupRequest } from '../types';

import { walletKeys } from './walletKeys';

const POLL_MS = 3_000;

/**
 * Polls a top-up while it is pending. The rider's return from the payment
 * page proves nothing; only the server (told by the gateway webhook) does.
 * Once it is paid, the balance and history are refreshed.
 */
export function useTopup(id: number) {
  const queryClient = useQueryClient();

  const query = useQuery<TopupRequest, ApiError>({
    queryKey: walletKeys.topup(id),
    queryFn: () => walletApi.getTopup(id),
    refetchInterval: (current) => (current.state.data?.status === 'pending' ? POLL_MS : false),
  });

  const isPaid = query.data?.status === 'paid';

  useEffect(() => {
    if (isPaid) {
      void queryClient.invalidateQueries({ queryKey: walletKeys.summary() });
      void queryClient.invalidateQueries({ queryKey: [...walletKeys.all, 'transactions'] });
    }
  }, [isPaid, queryClient]);

  return query;
}
