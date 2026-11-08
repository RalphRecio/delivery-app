import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { DEFAULT_CENTER } from '../types';

import { MapPin } from './MapPin';
import type { MapPickerProps } from './MapPickerProps';

const ZOOM = 16;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Web: Leaflet with OpenStreetMap tiles (no API key). The pin is a fixed
 * overlay in the centre; dragging the map moves the chosen point, Grab-style.
 */
export function MapPicker({ value, onChange, height = 240, testID }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onChangeRef = useRef(onChange);
  // Only a drag or zoom started by the user counts as choosing a point.
  // Our own recentres (GPS, suggestion, sample) jump without animation, so
  // their moveend fires synchronously while isProgrammatic is set and is ignored.
  const isProgrammatic = useRef(false);
  const hasUserMoved = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) {
      return;
    }

    const start = value ?? DEFAULT_CENTER;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([start.latitude, start.longitude], ZOOM);
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    map.on('dragstart zoomstart', () => {
      if (!isProgrammatic.current) {
        hasUserMoved.current = true;
      }
    });
    map.on('moveend', () => {
      if (isProgrammatic.current || !hasUserMoved.current) {
        return;
      }

      hasUserMoved.current = false;
      const center = map.getCenter();
      onChangeRef.current({ latitude: round(center.lat), longitude: round(center.lng) });
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later value changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre when the value changes from outside (e.g. "Use my location").
  useEffect(() => {
    const map = mapRef.current;

    if (map === null || value === null) {
      return;
    }

    const center = map.getCenter();

    if (!isSamePoint(center.lat, center.lng, value)) {
      isProgrammatic.current = true;
      hasUserMoved.current = false;
      map.setView([value.latitude, value.longitude], map.getZoom(), { animate: false });
      isProgrammatic.current = false;
    }
  }, [value]);

  return (
    <View style={[styles.frame, { height }]} testID={testID}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <MapPin />
    </View>
  );
}

function round(coordinate: number): number {
  return Math.round(coordinate * 1_000_000) / 1_000_000;
}

/** Within about a metre: map centres carry float noise past the 6th decimal. */
function isSamePoint(
  lat: number,
  lng: number,
  point: { latitude: number; longitude: number },
): boolean {
  return Math.abs(lat - point.latitude) < 1e-5 && Math.abs(lng - point.longitude) < 1e-5;
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: 10, overflow: 'hidden' },
});
