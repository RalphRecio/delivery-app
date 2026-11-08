import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { notificationsApi } from '../api/notificationsApi';
import { browserPush } from '../lib/browserPush';
import type { PushStatus } from '../types';

import { notificationKeys } from './notificationKeys';

/**
 * Where this browser stands with push, plus the two moves: turn on (asks
 * permission, subscribes, registers with the API) and turn off (unsubscribes
 * here and on the API). The status is re-read after either.
 */
export function usePushNotifications() {
  const queryClient = useQueryClient();
  const status = useQuery<PushStatus, Error>({
    queryKey: notificationKeys.pushStatus(),
    queryFn: () => browserPush.getStatus(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationKeys.pushStatus() });

  const turnOn = useMutation<null, ApiError | Error>({
    mutationFn: async () => {
      const publicKey = await notificationsApi.getPushPublicKey();

      if (publicKey === '') {
        throw new Error('Notifications are not set up on the server yet.');
      }

      return notificationsApi.subscribe(await browserPush.subscribe(publicKey));
    },
    onSettled: refresh,
  });

  const turnOff = useMutation<null, ApiError | Error>({
    mutationFn: async () => {
      const endpoint = await browserPush.unsubscribe();

      return endpoint === null ? null : notificationsApi.unsubscribe(endpoint);
    },
    onSettled: refresh,
  });

  return { status, turnOn, turnOff };
}
