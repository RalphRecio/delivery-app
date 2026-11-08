import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { adminApi } from '../api/adminApi';
import type { AdminBooking } from '../types';

import { adminKeys } from './adminKeys';
import { useSupportCancel } from './useAdminQueries';

jest.mock('../api/adminApi');

const mockedApi = jest.mocked(adminApi);

describe('useSupportCancel', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    queryClient.setQueryData(adminKeys.bookings({}), []);
    queryClient.setQueryData(adminKeys.dashboard(), { bookings_searching: 1 });
  });

  afterEach(() => queryClient.clear());

  it('stores the cancelled booking and refreshes the lists and dashboard', async () => {
    const cancelled = {
      id: 9,
      status: 'cancelled',
      cancellation_reason: 'Rider had an accident',
    } as AdminBooking;
    mockedApi.cancelBooking.mockResolvedValue(cancelled);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useSupportCancel(), { wrapper });

    result.current.mutate({ id: 9, reason: 'Rider had an accident' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.cancelBooking).toHaveBeenCalledWith(9, 'Rider had an accident');
    expect(queryClient.getQueryData(adminKeys.booking(9))).toEqual(cancelled);
    expect(queryClient.getQueryState(adminKeys.bookings({}))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(adminKeys.dashboard())?.isInvalidated).toBe(true);
  });
});
