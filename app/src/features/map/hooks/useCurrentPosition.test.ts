import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { useCurrentPosition } from './useCurrentPosition';

const mockedLocation = jest.mocked(Location);

describe('useCurrentPosition', () => {
  it('returns the device position when permission is granted', async () => {
    const { result } = await renderHook(() => useCurrentPosition());

    let point: unknown;
    await act(async () => {
      point = await result.current.locate();
    });

    expect(point).toEqual({ latitude: 10.3157, longitude: 123.8854 });
    expect(result.current.error).toBeUndefined();
  });

  it('reports a denied permission as an error instead of throwing', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);
    const { result } = await renderHook(() => useCurrentPosition());

    let point: unknown = 'unset';
    await act(async () => {
      point = await result.current.locate();
    });

    expect(point).toBeNull();
    expect(result.current.error).toMatch(/permission was denied/);
  });
});
