import * as Location from 'expo-location';

import type { LatLng } from '../types';

/** iOS and Android via expo-location; Metro picks getCurrentPosition.web.ts on web. */
export async function getCurrentPosition(): Promise<LatLng> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('Location permission was denied. Allow it in Settings and try again.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}
