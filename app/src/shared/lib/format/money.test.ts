import { formatMoney } from './money';

describe('formatMoney', () => {
  it.each([
    [0, '₱0.00'],
    [5, '₱0.05'],
    [12350, '₱123.50'],
    [1234505, '₱12,345.05'],
    [-250, '-₱2.50'],
  ])('formats %i centavos as %s', (centavos, expected) => {
    expect(formatMoney(centavos)).toBe(expected);
  });

  it('refuses non-integer input so float money never reaches the screen', () => {
    expect(() => formatMoney(12.5)).toThrow(TypeError);
  });
});
