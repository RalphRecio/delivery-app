import { useInfiniteQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';
import type { Paginated } from '@/shared/types/api';

import { walletApi } from '../api/walletApi';
import type { TransactionFilters, WalletTransaction } from '../types';

import { walletKeys } from './walletKeys';

/** Newest first, a page at a time; `fetchNextPage` loads older ones. */
export function useWalletTransactions(filters: TransactionFilters = {}, perPage = 25) {
  return useInfiniteQuery<
    Paginated<WalletTransaction>,
    ApiError,
    { pages: Paginated<WalletTransaction>[] },
    ReturnType<typeof walletKeys.transactions>,
    number
  >({
    queryKey: walletKeys.transactions(filters),
    queryFn: ({ pageParam }) =>
      walletApi.listTransactions({ ...filters, page: pageParam, per_page: perPage }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
  });
}
