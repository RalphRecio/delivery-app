import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { getCurrentPosition } from '@/features/map';

import { riderApi } from '../api/riderApi';

import { LOCATION_REPORT_INTERVAL_MS, useLiveLocationReporting } from './useLiveLocationReporting';

jest.mock('../api/riderApi');
jest.mock('@/features/map', () => ({ getCurrentPosition: jest.fn() }));

const mockedApi = jest.mocked(riderApi);
const mockedPosition = jest.mocked(getCurrentPosition);

const profile = {
  is_online: true,
  current_location: { latitude: 10.32, longitude: 123.9 },
  location_updated_at: '2026-11-03T08:00:00+00:00',
  last_seen_at: null,
};

describe('useLiveLocationReporting', () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    queryClient = new QueryClient();
    mockedPosition.mockResolvedValue({ latitude: 10.32, longitude: 123.9 });
    mockedApi.updateLocation.mockResolvedValue(profile);
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  it('sends the position at once and every 15 s during a job, and stops after', async () => {
    const { unmount } = await renderHook(() => useLiveLocationReporting(true), { wrapper });
    await act(async () => {});

    expect(mockedApi.updateLocation).toHaveBeenCalledTimes(1);
    expect(mockedApi.updateLocation).toHaveBeenCalledWith({ latitude: 10.32, longitude: 123.9 });

    await act(async () => {
      jest.advanceTimersByTime(LOCATION_REPORT_INTERVAL_MS * 2);
    });
    expect(mockedApi.updateLocation).toHaveBeenCalledTimes(3);

    await unmount();
    jest.advanceTimersByTime(LOCATION_REPORT_INTERVAL_MS * 2);
    expect(mockedApi.updateLocation).toHaveBeenCalledTimes(3);
  });

  it('does nothing without a job', async () => {
    await renderHook(() => useLiveLocationReporting(false), { wrapper });

    jest.advanceTimersByTime(LOCATION_REPORT_INTERVAL_MS * 3);
    expect(mockedPosition).not.toHaveBeenCalled();
  });

  it('keeps going after a failed position read', async () => {
    mockedPosition.mockRejectedValueOnce(new Error('denied'));
    await renderHook(() => useLiveLocationReporting(true), { wrapper });
    await act(async () => {});

    expect(mockedApi.updateLocation).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(LOCATION_REPORT_INTERVAL_MS);
    });
    expect(mockedApi.updateLocation).toHaveBeenCalledTimes(1);
  });
});
