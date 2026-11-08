import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';

import { riderKeys } from './riderKeys';
import { useAcceptJob } from './useAcceptJob';

jest.mock('../api/riderApi');

const mockedApi = jest.mocked(riderApi);

describe('useAcceptJob', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    queryClient.setQueryData(riderKeys.availableJobs(), [{ id: 7 }]);
  });

  afterEach(() => queryClient.clear());

  it('drops the stale offer list when another rider won the race', async () => {
    mockedApi.acceptJob.mockRejectedValue(
      new ApiError('http', 'This job is no longer available.', 409),
    );
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useAcceptJob(), { wrapper });

    result.current.mutate(7);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('This job is no longer available.');
    expect(queryClient.getQueryState(riderKeys.availableJobs())?.isInvalidated).toBe(true);
  });
});
