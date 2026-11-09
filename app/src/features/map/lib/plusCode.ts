import type { LatLng } from '../types';

/**
 * Google Plus Codes (Open Location Code, an open, key-free algorithm).
 * People in the Philippines often share these instead of a street address,
 * e.g. "97G7+7RG Parang, Maguindanao del Norte". Geocoders like Nominatim do
 * not understand them, so they are decoded here.
 *
 * Spec: https://github.com/google/open-location-code/blob/main/Documentation/Specification/specification.md
 */

const ALPHABET = '23456789CFGHJMPQRVWX';
const SEPARATOR = '+';
const SEPARATOR_POSITION = 8;
/** Degrees covered by one digit in each of the five lat/lng pairs. */
const PAIR_RESOLUTIONS = [20, 1, 0.05, 0.0025, 0.000125] as const;
const PAIR_CODE_LENGTH = 10;
const GRID_ROWS = 5;
const GRID_COLUMNS = 4;
const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

/** A code anywhere in free text: 2–8 digits, "+", then 2+ digits (no zero padding). */
const CODE_IN_TEXT =
  /(?:^|[\s,(])([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,})(?=$|[\s,)])/i;

export interface PlusCodeMatch {
  /** The code, upper-cased, e.g. "97G7+7RG". */
  code: string;
  /** True when the code has all 8 digits before "+" and needs no reference point. */
  isFull: boolean;
  /** The text around the code, e.g. "Parang, Maguindanao del Norte"; empty when none. */
  locality: string;
}

/** Finds a Plus Code in what the user typed or pasted, or null when there is none. */
export function findPlusCode(text: string): PlusCodeMatch | null {
  const match = CODE_IN_TEXT.exec(text);
  const code = match?.[1]?.toUpperCase();

  if (match === null || code === undefined || !isValidCode(code)) {
    return null;
  }

  const locality = (text.slice(0, match.index) + ' ' + text.slice(match.index + match[0].length))
    .replace(/\s+/g, ' ')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/\s*,\s*(,\s*)*/g, ', ');

  return { code, isFull: code.indexOf(SEPARATOR) === SEPARATOR_POSITION, locality };
}

/** Centre of the area a full code (8 digits before "+") describes. */
export function decodeFullCode(code: string): LatLng {
  const digits = code.toUpperCase().replace(SEPARATOR, '');
  let latitude = -MAX_LATITUDE;
  let longitude = -MAX_LONGITUDE;
  let latitudeSize = 0;
  let longitudeSize = 0;

  for (let i = 0; i < Math.min(digits.length, PAIR_CODE_LENGTH); i += 2) {
    const resolution = PAIR_RESOLUTIONS[i / 2] ?? 0;
    latitude += digitValue(digits[i]) * resolution;
    longitude += digitValue(digits[i + 1]) * resolution;
    latitudeSize = resolution;
    longitudeSize = resolution;
  }

  // Digits past the tenth refine a 5-row by 4-column grid inside the last cell.
  for (const digit of digits.slice(PAIR_CODE_LENGTH)) {
    const value = digitValue(digit);
    latitudeSize /= GRID_ROWS;
    longitudeSize /= GRID_COLUMNS;
    latitude += Math.floor(value / GRID_COLUMNS) * latitudeSize;
    longitude += (value % GRID_COLUMNS) * longitudeSize;
  }

  return {
    latitude: latitude + latitudeSize / 2,
    longitude: longitude + longitudeSize / 2,
  };
}

/**
 * Centre of the area a short code (e.g. "97G7+7RG") describes, taking the
 * occurrence nearest to the reference point. Short codes repeat every few
 * hundred kilometres, so the reference must be within roughly half that.
 */
export function decodeShortCode(code: string, reference: LatLng): LatLng {
  const upper = code.toUpperCase();
  const missingDigits = SEPARATOR_POSITION - upper.indexOf(SEPARATOR);
  // Size of the area the missing leading digits select, e.g. 1° for 4 missing digits.
  const areaSize = PAIR_RESOLUTIONS[missingDigits / 2 - 1] ?? 0;
  const prefix = encodePairs(reference, missingDigits);
  const decoded = decodeFullCode(prefix + upper);

  return {
    latitude: nearest(decoded.latitude, reference.latitude, areaSize, false),
    longitude: nearest(decoded.longitude, reference.longitude, areaSize, true),
  };
}

function isValidCode(code: string): boolean {
  const separatorIndex = code.indexOf(SEPARATOR);
  const isEvenPrefix = separatorIndex % 2 === 0;

  if (!isEvenPrefix || separatorIndex > SEPARATOR_POSITION) {
    return false;
  }

  if (separatorIndex === SEPARATOR_POSITION) {
    // The first pair must stay on the globe: latitude digit < 9, longitude digit < 18.
    return (
      digitValue(code[0]) * PAIR_RESOLUTIONS[0] < 2 * MAX_LATITUDE &&
      digitValue(code[1]) * PAIR_RESOLUTIONS[0] < 2 * MAX_LONGITUDE
    );
  }

  return true;
}

/** The first `length` digits of the full code for a point. */
function encodePairs(point: LatLng, length: number): string {
  let latitude =
    Math.min(Math.max(point.latitude, -MAX_LATITUDE), MAX_LATITUDE - 1e-9) + MAX_LATITUDE;
  let longitude = normaliseLongitude(point.longitude) + MAX_LONGITUDE;
  let digits = '';

  for (let i = 0; i < length / 2; i += 1) {
    const resolution = PAIR_RESOLUTIONS[i] ?? 1;
    const latitudeDigit = Math.floor(latitude / resolution);
    const longitudeDigit = Math.floor(longitude / resolution);
    latitude -= latitudeDigit * resolution;
    longitude -= longitudeDigit * resolution;
    digits += (ALPHABET[latitudeDigit] ?? '') + (ALPHABET[longitudeDigit] ?? '');
  }

  return digits;
}

/** Shifts a decoded coordinate by one area if that lands it closer to the reference. */
function nearest(value: number, reference: number, areaSize: number, wraps: boolean): number {
  const limit = wraps ? MAX_LONGITUDE : MAX_LATITUDE;
  const half = areaSize / 2;
  let result = value;

  if (reference + half < value && (wraps || value - areaSize >= -limit)) {
    result = value - areaSize;
  } else if (reference - half > value && (wraps || value + areaSize <= limit)) {
    result = value + areaSize;
  }

  return wraps ? normaliseLongitude(result) : result;
}

function normaliseLongitude(longitude: number): number {
  return ((((longitude + MAX_LONGITUDE) % 360) + 360) % 360) - MAX_LONGITUDE;
}

function digitValue(digit: string | undefined): number {
  return ALPHABET.indexOf(digit ?? '');
}
