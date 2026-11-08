import type { z } from 'zod';

import type { storeCategorySchema, storeProductSchema, storeSchema } from './schemas/storeSchemas';

export type Store = z.infer<typeof storeSchema>;
export type StoreProduct = z.infer<typeof storeProductSchema>;
export type StoreCategory = z.infer<typeof storeCategorySchema>;

export interface StoreFilters {
  near?: { latitude: number; longitude: number } | null;
  search?: string;
  /** Only stores that fit this Pabili (e.g. restaurants for food). */
  pabiliCategory?: string;
}
