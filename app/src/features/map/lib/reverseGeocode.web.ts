import type { LatLng } from '../types';

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

interface NominatimResponse {
  display_name?: string;
  address?: Record<string, string | undefined>;
}

/**
 * OpenStreetMap's Nominatim, which needs no API key. It asks for light use
 * (about one request per second), which the debounce in the hook respects.
 * Returns null when nothing sensible is known for the point.
 */
export async function reverseGeocode(point: LatLng, signal?: AbortSignal): Promise<string | null> {
  const url = `${ENDPOINT}?format=jsonv2&zoom=18&lat=${point.latitude}&lon=${point.longitude}`;
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as NominatimResponse;
  const parts = body.address;

  if (parts === undefined) {
    return body.display_name ?? null;
  }

  const line = [
    [parts.house_number, parts.road].filter(Boolean).join(' '),
    parts.neighbourhood ?? parts.suburb ?? parts.village,
    parts.city ?? parts.town ?? parts.municipality,
  ]
    .filter((part) => part !== undefined && part !== '')
    .join(', ');

  return line === '' ? (body.display_name ?? null) : line;
}
