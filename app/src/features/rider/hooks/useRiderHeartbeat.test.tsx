import { renderHook } from '@testing-library/react-native';

import { riderApi } from '../api/riderApi';

import { HEARTBEAT_INTERVAL_MS, useRiderHeartbeat } from './useRiderHeartbeat';

jest.mock('../api/riderApi');

const mockedApi = jest.mocked(riderApi);

describe('useRiderHeartbeat', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockedApi.heartbeat.mockResolvedValue({
      is_online: true,
      current_location: null,
      location_updated_at: null,
      last_seen_at: null,
    });
  });

  afterEach(() => jest.useRealTimers());

  it('beats at once and then every minute while online, and stops on unmount', async () => {
    const { unmount } = await renderHook(() => useRiderHeartbeat(true));

    expect(mockedApi.heartbeat).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
    expect(mockedApi.heartbeat).toHaveBeenCalledTimes(3);

    await unmount();
    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
    expect(mockedApi.heartbeat).toHaveBeenCalledTimes(3);
  });

  it('stays quiet while offline', async () => {
    await renderHook(() => useRiderHeartbeat(false));

    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3);
    expect(mockedApi.heartbeat).not.toHaveBeenCalled();
  });
});
