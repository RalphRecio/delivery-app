export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Metro Cebu, where the service launches; used before any pin or GPS fix exists. */
export const DEFAULT_CENTER: LatLng = { latitude: 10.3157, longitude: 123.8854 };
