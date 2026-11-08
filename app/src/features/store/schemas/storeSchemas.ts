import { z } from 'zod';

const moneySchema = z.object({
  centavos: z.number().int(),
  currency: z.literal('PHP'),
  formatted: z.string(),
});

export const storeCategorySchema = z.enum([
  'grocery',
  'pharmacy',
  'restaurant',
  'convenience',
  'bakery',
  'other',
]);

export const storeProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  price: moneySchema,
  is_available: z.boolean(),
});

export const storeSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  category: storeCategorySchema,
  category_label: z.string(),
  address: z.string(),
  landmark: z.string().nullable(),
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  distance_meters: z.number().int().optional(),
  products: z.array(storeProductSchema).optional(),
});
