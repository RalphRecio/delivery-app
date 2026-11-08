import { formatPhilippineMobile, normalizePhilippineMobile } from './phone';

describe('normalizePhilippineMobile', () => {
  it.each([
    '+639171234567',
    '639171234567',
    '09171234567',
    '9171234567',
    '0917 123 4567',
    '+63 917-123-4567',
    ' 09171234567 ',
  ])('normalises %s to E.164', (input) => {
    expect(normalizePhilippineMobile(input)).toBe('+639171234567');
  });

  it.each(['', 'abc', '0287654321', '+14155552671', '917123456', '091712345678', '08171234567'])(
    'rejects %s',
    (input) => {
      expect(normalizePhilippineMobile(input)).toBeNull();
    },
  );
});

describe('formatPhilippineMobile', () => {
  it('groups the digits for reading', () => {
    expect(formatPhilippineMobile('+639171234567')).toBe('+63 917 123 4567');
  });

  it('leaves unexpected values untouched', () => {
    expect(formatPhilippineMobile('12345')).toBe('12345');
  });
});
