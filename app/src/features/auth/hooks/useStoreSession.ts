import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';

import type { AuthSession } from '../types';

import { authKeys } from './authKeys';

/**
 * What every successful sign-in does: persist the token and seed the user
 * into the query cache, so the home screen renders without a second round trip.
 */
export function useStoreSession() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return async (session: AuthSession): Promise<void> => {
    queryClient.setQueryData(authKeys.currentUser(), session.user);
    await setSession({ token: session.token, role: session.user.role });
  };
}
