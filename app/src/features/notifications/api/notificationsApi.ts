import { z } from 'zod';

import { apiRequest } from '@/shared/lib/api';

import { pushPublicKeySchema } from '../schemas/notificationSchemas';
import type { PushSubscriptionInput } from '../types';

export const notificationsApi = {
  getPushPublicKey: (): Promise<string> =>
    apiRequest({ method: 'GET', url: '/auth/push/public-key' }, pushPublicKeySchema).then(
      (data) => data.public_key,
    ),

  subscribe: (input: PushSubscriptionInput): Promise<null> =>
    apiRequest({ method: 'POST', url: '/auth/push-subscriptions', data: input }, z.null()),

  unsubscribe: (endpoint: string): Promise<null> =>
    apiRequest({ method: 'DELETE', url: '/auth/push-subscriptions', data: { endpoint } }, z.null()),
};
