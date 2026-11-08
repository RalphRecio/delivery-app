import type { LatLng } from '../types';

const TIMEOUT_MS = 10_000;

/** Browser Geolocation API. The page must be on localhost or https for it to work. */
export function getCurrentPosition(): Promise<LatLng> {
  const geolocation = globalThis.navigator?.geolocation;

  if (geolocation === undefined) {
    return Promise.reject(new Error('This browser cannot share its location.'));
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? 'Location permission was denied. Allow it in the browser and try again.'
              : 'Could not get your location. Try again or drag the map.',
          ),
        ),
      { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 15_000 },
    );
  });
}
