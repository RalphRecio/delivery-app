import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { storeApi } from '../api/storeApi';
import type { Store, StoreFilters } from '../types';

import { storeKeys } from './storeKeys';

export function useStores(filters: StoreFilters) {
  return useQuery<Store[], ApiError>({
    queryKey: storeKeys.list(filters),
    queryFn: () => storeApi.listStores(filters),
    placeholderData: (previous) => previous,
  });
}

export function useStore(id: number) {
  return useQuery<Store, ApiError>({
    queryKey: storeKeys.detail(id),
    queryFn: () => storeApi.getStore(id),
  });
}
