import type { LatLng } from '../types';

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
 */
export async function searchPlaces(
  query: string,
  near: LatLng | null,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    countrycodes: 'ph',
    addressdetails: '1',
    limit: String(LIMIT),
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

  const results = (await response.json()) as NominatimResult[];

  return dedupe(results.map(toSuggestion));
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
