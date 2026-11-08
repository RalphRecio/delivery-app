import type { StoreFilters } from '../types';

export const storeKeys = {
  all: ['stores'] as const,
  list: (filters: StoreFilters) => [...storeKeys.all, 'list', filters] as const,
  detail: (id: number) => [...storeKeys.all, 'detail', id] as const,
};
