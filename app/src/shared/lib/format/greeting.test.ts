import { filipinoGreeting } from './greeting';

const at = (hour: number) => new Date(2026, 10, 3, hour, 30);

describe('filipinoGreeting', () => {
  it('follows the time of day', () => {
    expect(filipinoGreeting(at(6))).toBe('Magandang umaga');
    expect(filipinoGreeting(at(12))).toBe('Magandang hapon');
    expect(filipinoGreeting(at(17))).toBe('Magandang hapon');
    expect(filipinoGreeting(at(18))).toBe('Magandang gabi');
  });
});
