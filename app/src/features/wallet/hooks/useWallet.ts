import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { walletApi } from '../api/walletApi';
import type { WalletSummary } from '../types';

import { walletKeys } from './walletKeys';

export function useWallet() {
  return useQuery<WalletSummary, ApiError>({
    queryKey: walletKeys.summary(),
    queryFn: walletApi.getWallet,
  });
}
