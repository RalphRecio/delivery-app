import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';
import { useAuthStore } from '@/stores/authStore';

import { authApi } from '../api/authApi';
import type { User } from '../types';

import { authKeys } from './authKeys';

export function useCurrentUser() {
  const isSignedIn = useAuthStore((state) => state.session !== null);

  return useQuery<User, ApiError>({
    queryKey: authKeys.currentUser(),
    queryFn: authApi.getCurrentUser,
    enabled: isSignedIn,
  });
}
