import type { LatLng } from '../types';

import { decodeFullCode, decodeShortCode, findPlusCode, type PlusCodeMatch } from './plusCode';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const LIMIT = 6;

export interface PlaceSuggestion {
  id: string;
  /** The place or street name, shown bold. */
  title: string;
  /** The rest of the address, shown muted. */
  subtitle: string;
  point: LatLng;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: Record<string, string | undefined>;
}

/**
 * Address autocomplete, Grab-style, from OpenStreetMap's Nominatim (no key).
 * Results are limited to the Philippines and biased towards the given point
 * when there is one. Light use only: the hook debounces and aborts.
 *
 * Google Plus Codes ("97G7+7RG Parang, Maguindanao del Norte") are decoded
 * locally instead, because Nominatim does not understand them.
 */
export async function searchPlaces(
  query: string,
  near: LatLng | null,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const plusCode = findPlusCode(query);

  if (plusCode !== null) {
    const suggestion = await resolvePlusCode(plusCode, near, signal);

    return suggestion === null ? [] : [suggestion];
  }

  return dedupe((await nominatimSearch(query, near, LIMIT, signal)).map(toSuggestion));
}

/**
 * A full code decodes on its own. A short code ("97G7+7RG") repeats every
 * ~100 km, so it is resolved against the town named after it, or the user's
 * current point when no town was given.
 */
async function resolvePlusCode(
  match: PlusCodeMatch,
  near: LatLng | null,
  signal?: AbortSignal,
): Promise<PlaceSuggestion | null> {
  const subtitle = match.locality === '' ? 'Plus Code' : match.locality;

  if (match.isFull) {
    return {
      id: `plus:${match.code}`,
      title: match.code,
      subtitle,
      point: decodeFullCode(match.code),
    };
  }

  const reference = (await locateTown(match.locality, signal)) ?? near;

  if (reference === null) {
    return null;
  }

  return {
    id: `plus:${match.code}`,
    title: match.code,
    subtitle,
    point: decodeShortCode(match.code, reference),
  };
}

/**
 * Finds the town in a Google-style locality ("Brgy, Poblacion, Parang,
 * Maguindanao del Norte"). Only the trailing town and province are searched:
 * they are what Nominatim reliably knows, and they are precise enough for a
 * short code, which only needs a point within ~50 km.
 */
async function locateTown(locality: string, signal?: AbortSignal): Promise<LatLng | null> {
  const parts = locality
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  const candidates = [parts.slice(-2).join(', '), parts.slice(-1).join(', ')].filter(
    (candidate, index, all) => candidate !== '' && all.indexOf(candidate) === index,
  );

  for (const candidate of candidates) {
    const [first] = await nominatimSearch(candidate, null, 1, signal);

    if (first !== undefined) {
      return { latitude: Number(first.lat), longitude: Number(first.lon) };
    }
  }

  return null;
}

async function nominatimSearch(
  query: string,
  near: LatLng | null,
  limit: number,
  signal?: AbortSignal,
): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    countrycodes: 'ph',
    addressdetails: '1',
    limit: String(limit),
  });

  if (near !== null) {
    // A loose box around the point (~50 km) nudges results towards the user without excluding others.
    const d = 0.5;
    params.set(
      'viewbox',
      `${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}`,
    );
  }

  const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json', 'Accept-Language': 'en' },
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as NominatimResult[];
}

/** Nominatim often returns the same place as several map objects; keep the first of each name + locality. */
function dedupe(suggestions: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const key = `${suggestion.title}|${suggestion.subtitle}`.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

export function toSuggestion(result: NominatimResult): PlaceSuggestion {
  const parts = result.address ?? {};
  const title =
    result.name !== undefined && result.name !== ''
      ? result.name
      : [parts.house_number, parts.road].filter(Boolean).join(' ') ||
        result.display_name.split(',')[0]?.trim() ||
        'Unnamed place';
  const subtitle = [
    parts.neighbourhood ?? parts.suburb ?? parts.village,
    parts.city ?? parts.town ?? parts.municipality,
    parts.state,
  ]
    .filter((part) => part !== undefined && part !== '' && part !== title)
    .join(', ');

  return {
    id: String(result.place_id),
    title,
    subtitle: subtitle === '' ? result.display_name : subtitle,
    point: { latitude: Number(result.lat), longitude: Number(result.lon) },
  };
}
