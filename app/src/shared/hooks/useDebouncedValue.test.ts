import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('only settles after the value stops changing', async () => {
    const { result, rerender } = await renderHook(
      (props: { value: string }) => useDebouncedValue(props.value, 300),
      { initialProps: { value: 'r' } },
    );

    await rerender({ value: 'ri' });
    await rerender({ value: 'ric' });
    expect(result.current).toBe('r');

    await act(() => jest.advanceTimersByTime(300));

    expect(result.current).toBe('ric');
  });
});
