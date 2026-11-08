import { formatDistance } from './distance';

describe('formatDistance', () => {
  it.each([
    [0, '0 m'],
    [849.6, '850 m'],
    [999, '999 m'],
    [1000, '1.0 km'],
    [1250, '1.3 km'],
    [13600, '13.6 km'],
  ])('formats %f metres as %s', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });
});
