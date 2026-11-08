import { Platform } from 'react-native';
import { z } from 'zod';

import { apiRequest } from '@/shared/lib/api';

import { authSessionSchema, userSchema } from '../schemas/authSchemas';
import type { AuthSession, LoginRequest, RegisterInput, User } from '../types';

export const authApi = {
  register: (input: RegisterInput): Promise<AuthSession> =>
    apiRequest(
      { method: 'POST', url: '/auth/register', data: { ...input, device_name: Platform.OS } },
      authSessionSchema,
    ),

  login: (input: LoginRequest): Promise<AuthSession> =>
    apiRequest(
      { method: 'POST', url: '/auth/login', data: { ...input, device_name: Platform.OS } },
      authSessionSchema,
    ),

  getCurrentUser: (): Promise<User> => apiRequest({ method: 'GET', url: '/auth/me' }, userSchema),

  logout: (): Promise<null> => apiRequest({ method: 'POST', url: '/auth/logout' }, z.null()),
};
