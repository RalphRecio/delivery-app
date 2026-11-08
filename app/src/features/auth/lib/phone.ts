const COUNTRY_CODE = '63';
const NATIONAL_PATTERN = /^9\d{9}$/;

/**
 * Client-side mirror of the backend PhoneNumber value object: turns any common
 * spelling of a Philippine mobile ("0917 123 4567", "+63917...") into E.164,
 * or null when it is not one. The server re-validates; this only gives the
 * user instant feedback and a consistent value to send.
 */
export function normalizePhilippineMobile(input: string): string | null {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D+/g, '');

  if (digits === '') {
    return null;
  }

  let national: string | null = null;

  if (digits.startsWith(COUNTRY_CODE) && digits.length === 12) {
    national = digits.slice(2);
  } else if (hasPlus) {
    national = null;
  } else if (digits.startsWith('0') && digits.length === 11) {
    national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  }

  if (national === null || !NATIONAL_PATTERN.test(national)) {
    return null;
  }

  return `+${COUNTRY_CODE}${national}`;
}

/** "+639171234567" -> "+63 917 123 4567" for display. */
export function formatPhilippineMobile(e164: string): string {
  const match = /^\+63(9\d{2})(\d{3})(\d{4})$/.exec(e164);

  if (match === null) {
    return e164;
  }

  return `+63 ${match[1]} ${match[2]} ${match[3]}`;
}
