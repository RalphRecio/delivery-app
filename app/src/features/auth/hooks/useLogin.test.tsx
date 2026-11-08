import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { sessionStorage } from '@/shared/lib/storage/sessionStorage';
import { useAuthStore } from '@/stores/authStore';

import { authApi } from '../api/authApi';
import type { AuthSession } from '../types';

import { authKeys } from './authKeys';
import { useLogin } from './useLogin';

jest.mock('../api/authApi');

const mockedAuthApi = jest.mocked(authApi);

const session: AuthSession = {
  token: 'token-123',
  user: {
    id: 1,
    first_name: 'Rico',
    last_name: 'Rider',
    name: 'Rico Rider',
    email: 'rider@example.com',
    phone: '+639171234567',
    role: 'rider',
    is_active: true,
    deactivated_at: null,
    created_at: '2026-11-02T00:00:00+00:00',
  },
};

describe('useLogin', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    await sessionStorage.clear();
    useAuthStore.setState({ session: null, isHydrated: true });
    mockedAuthApi.login.mockResolvedValue(session);
  });

  // Drops the cache's garbage-collection timers so Jest can exit cleanly.
  afterEach(() => queryClient.clear());

  it('stores the session and seeds the current user on success', async () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: 'rider@example.com', password: 'password', portal: 'rider' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // TanStack Query passes a context object as the second argument.
    expect(mockedAuthApi.login.mock.calls[0]?.[0]).toEqual({
      email: 'rider@example.com',
      password: 'password',
      portal: 'rider',
    });
    expect(useAuthStore.getState().session).toEqual({ token: 'token-123', role: 'rider' });
    expect(await sessionStorage.load()).toEqual({ token: 'token-123', role: 'rider' });
    expect(queryClient.getQueryData(authKeys.currentUser())).toEqual(session.user);
  });
});
