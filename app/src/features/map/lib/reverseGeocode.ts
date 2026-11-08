import * as Location from 'expo-location';

import type { LatLng } from '../types';

/**
 * On-device reverse geocoding (Apple / Google), no network key needed.
 * The signal exists so the signature matches the web version; the native
 * call cannot be cancelled, so a late result is simply ignored by the hook.
 */
export async function reverseGeocode(point: LatLng, signal?: AbortSignal): Promise<string | null> {
  void signal;

  const [place] = await Location.reverseGeocodeAsync(point);

  if (place === undefined) {
    return null;
  }

  const line = [
    [place.streetNumber, place.street].filter(Boolean).join(' '),
    place.district ?? place.subregion,
    place.city,
  ]
    .filter((part) => part !== undefined && part !== null && part !== '')
    .join(', ');

  return line === '' ? (place.name ?? null) : line;
}
