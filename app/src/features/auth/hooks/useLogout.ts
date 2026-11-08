import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';
import { useAuthStore } from '@/stores/authStore';

import { authApi } from '../api/authApi';

/**
 * Signs out locally no matter what the server says: a dead network must not
 * trap someone on a signed-in screen. The token is revoked server-side when
 * the request gets through; if it does not, it simply expires.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation<null, ApiError, void>({
    mutationFn: authApi.logout,
    onSettled: async () => {
      await clearSession();
      queryClient.clear();
    },
  });
}
