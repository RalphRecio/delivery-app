import { z } from 'zod';

import { apiRequest } from '@/shared/lib/api';

import { storeSchema } from '../schemas/storeSchemas';
import type { Store, StoreFilters } from '../types';

export const storeApi = {
  listStores: (filters: StoreFilters): Promise<Store[]> =>
    apiRequest(
      {
        method: 'GET',
        url: '/customer/stores',
        params: {
          ...(filters.near
            ? { latitude: filters.near.latitude, longitude: filters.near.longitude }
            : {}),
          ...(filters.search !== undefined && filters.search !== ''
            ? { search: filters.search }
            : {}),
          ...(filters.pabiliCategory !== undefined
            ? { pabili_category: filters.pabiliCategory }
            : {}),
        },
      },
      z.array(storeSchema),
    ),

  getStore: (id: number): Promise<Store> =>
    apiRequest({ method: 'GET', url: `/customer/stores/${id}` }, storeSchema),
};
