const METERS_PER_KILOMETER = 1000;

/** "850 m" below one kilometre, "1.2 km" above. */
export function formatDistance(meters: number): string {
  if (meters < METERS_PER_KILOMETER) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / METERS_PER_KILOMETER).toFixed(1)} km`;
}
