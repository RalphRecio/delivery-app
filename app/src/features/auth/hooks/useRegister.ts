import { useMutation } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { authApi } from '../api/authApi';
import type { AuthSession, RegisterInput } from '../types';

import { useStoreSession } from './useStoreSession';

/** Registration signs the new customer in straight away. */
export function useRegister() {
  const storeSession = useStoreSession();

  return useMutation<AuthSession, ApiError, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: storeSession,
  });
}
