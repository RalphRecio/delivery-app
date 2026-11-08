import type { LatLng } from '../types';

export interface MapPickerProps {
  /** Null until the user picks or locates; the map then starts at the default centre. */
  value: LatLng | null;
  onChange: (point: LatLng) => void;
  height?: number;
  testID?: string;
}
