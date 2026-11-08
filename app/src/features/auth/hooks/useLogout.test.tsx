import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/shared/lib/api';
import { useAuthStore } from '@/stores/authStore';

import { authApi } from '../api/authApi';

import { authKeys } from './authKeys';
import { useLogout } from './useLogout';

jest.mock('../api/authApi');

const mockedAuthApi = jest.mocked(authApi);

describe('useLogout', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    queryClient.setQueryData(authKeys.currentUser(), { id: 1 });
    await useAuthStore.getState().setSession({ token: 'token-123', role: 'customer' });
  });

  it.each([
    ['the server confirms', () => mockedAuthApi.logout.mockResolvedValue(null)],
    [
      'the network is down',
      () => mockedAuthApi.logout.mockRejectedValue(new ApiError('network', 'Offline')),
    ],
  ])('clears the session and cache when %s', async (_label, arrange) => {
    arrange();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    await waitFor(() => expect(useAuthStore.getState().session).toBeNull());

    expect(queryClient.getQueryData(authKeys.currentUser())).toBeUndefined();
  });
});
