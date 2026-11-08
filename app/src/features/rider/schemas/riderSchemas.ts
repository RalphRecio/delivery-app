import { z } from 'zod';

export const riderProfileSchema = z.object({
  is_online: z.boolean(),
  current_location: z.object({ latitude: z.number(), longitude: z.number() }).nullable(),
  location_updated_at: z.string().nullable(),
  last_seen_at: z.string().nullable(),
});

export const locationFormSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});
