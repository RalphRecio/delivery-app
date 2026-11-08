import type { z } from 'zod';

import type { ridersOnDutySchema } from './schemas/customerSchemas';

export type RidersOnDuty = z.infer<typeof ridersOnDutySchema>;
