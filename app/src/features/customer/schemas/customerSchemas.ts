import { z } from 'zod';

export const ridersOnDutySchema = z.object({
  service_area: z.string(),
  riders_on_duty: z.number().int().nonnegative(),
});
