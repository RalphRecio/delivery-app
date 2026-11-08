import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';

import { DEFAULT_CENTER, type LatLng } from '../types';

import { MapPin } from './MapPin';
import type { MapPickerProps } from './MapPickerProps';

/** About a 1 km wide view at phone width. */
const DELTA = 0.008;

/**
 * iOS / Android: react-native-maps (Apple Maps on iOS, Google Maps on
 * Android). The pin stays in the centre; dragging the map picks the point.
 * Metro picks MapPicker.web.tsx on web; this file is also what TypeScript
 * type-checks against, so both keep the same props.
 */
export function MapPicker({ value, onChange, height = 240, testID }: MapPickerProps) {
  const mapRef = useRef<MapView>(null);
  // Set while we move the map ourselves (GPS, sample, typed value) so the
  // resulting region change is not mistaken for the user dragging.
  const isProgrammaticMove = useRef(false);
  const start = value ?? DEFAULT_CENTER;

  useEffect(() => {
    if (value !== null) {
      isProgrammaticMove.current = true;
      mapRef.current?.animateToRegion(toRegion(value), 300);
    }
  }, [value]);

  const handleRegionChange = (region: Region) => {
    if (isProgrammaticMove.current) {
      isProgrammaticMove.current = false;

      return;
    }

    onChange({ latitude: round(region.latitude), longitude: round(region.longitude) });
  };

  return (
    <View style={[styles.frame, { height }]} testID={testID}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={toRegion(start)}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
      />
      <MapPin />
    </View>
  );
}

function toRegion(point: LatLng): Region {
  return { ...point, latitudeDelta: DELTA, longitudeDelta: DELTA };
}

function round(coordinate: number): number {
  return Math.round(coordinate * 1_000_000) / 1_000_000;
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: 10, overflow: 'hidden' },
});
