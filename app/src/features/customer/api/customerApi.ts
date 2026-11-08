import { apiRequest } from '@/shared/lib/api';

import { ridersOnDutySchema } from '../schemas/customerSchemas';
import type { RidersOnDuty } from '../types';

export const customerApi = {
  getRidersOnDuty: (): Promise<RidersOnDuty> =>
    apiRequest({ method: 'GET', url: '/customer/riders/on-duty' }, ridersOnDutySchema),
};
