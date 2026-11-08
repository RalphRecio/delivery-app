import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { colors } from '@/config/theme';

import type { LatLng } from '../types';

import type { TrackingMapProps } from './TrackingMapProps';

/** Amber so the pickup reads apart from the green drop-off and rider. */
const PICKUP_COLOR = '#F59E0B';

const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

/**
 * iOS / Android: react-native-maps with the rider, pickup and drop-off.
 * Frames all points until the customer moves the map. Metro picks
 * TrackingMap.web.tsx on web; both share TrackingMapProps.
 */
export function TrackingMap({ rider, pickup, dropoff, height = 260 }: TrackingMapProps) {
  const mapRef = useRef<MapView>(null);
  const hasUserMoved = useRef(false);

  useEffect(() => {
    if (hasUserMoved.current) {
      return;
    }

    const points = [rider, pickup, dropoff].filter((p): p is LatLng => p !== null);
    mapRef.current?.fitToCoordinates(points, { edgePadding: EDGE_PADDING, animated: true });
  }, [rider, pickup, dropoff]);

  return (
    <View style={[styles.frame, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...dropoff, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        onPanDrag={() => {
          hasUserMoved.current = true;
        }}
      >
        {pickup !== null && <Marker coordinate={pickup} title="Pickup" pinColor={PICKUP_COLOR} />}
        <Marker coordinate={dropoff} title="Drop-off" pinColor={colors.primaryDeep} />
        {rider !== null && (
          <Marker coordinate={rider} title="Your rider" pinColor={colors.primary} />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: 10, overflow: 'hidden' },
});
