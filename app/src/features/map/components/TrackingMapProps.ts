import type { LatLng } from '../types';

export interface TrackingMapProps {
  /** Null until the rider app has reported a position. */
  rider: LatLng | null;
  /** Null when there is no separate pickup (a Pabili where the rider chooses the store). */
  pickup: LatLng | null;
  dropoff: LatLng;
  height?: number;
}
