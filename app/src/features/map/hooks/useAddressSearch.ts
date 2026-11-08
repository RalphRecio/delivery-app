import { useEffect, useState } from 'react';

import { searchPlaces, type PlaceSuggestion } from '../lib/searchPlaces';
import type { LatLng } from '../types';

const DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 3;

/**
 * Suggestions for what the user is typing in an address field. Waits for a
 * pause in typing, cancels superseded requests, and clears when the query
 * is too short or the field is not being edited.
 */
export function useAddressSearch(query: string, near: LatLng | null, isEnabled: boolean) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trimmed = query.trim();
  const isActive = isEnabled && trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchPlaces(trimmed, near, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) {
            setSuggestions(results);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `near` only biases ranking; re-searching on every pin move would spam the geocoder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, isActive]);

  // Stale results stay in state when the query shrinks; they are simply not shown.
  return { suggestions: isActive ? suggestions : [], isSearching: isActive && isSearching };
}
