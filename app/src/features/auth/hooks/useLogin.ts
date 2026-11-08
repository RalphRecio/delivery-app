import { useMutation } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { authApi } from '../api/authApi';
import type { AuthSession, LoginRequest } from '../types';

import { useStoreSession } from './useStoreSession';

export function useLogin() {
  const storeSession = useStoreSession();

  return useMutation<AuthSession, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: storeSession,
  });
}
