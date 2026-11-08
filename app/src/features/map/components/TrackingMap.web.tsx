import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/config/theme';

import type { LatLng } from '../types';

import type { TrackingMapProps } from './TrackingMapProps';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const FIT_PADDING: L.PointExpression = [36, 36];
const MAX_FIT_ZOOM = 16;
/** Amber so the pickup reads apart from the green drop-off and rider. */
const PICKUP_COLOR = '#F59E0B';

/** The rider: a green disc with a bike, drawn in HTML so no image assets are needed. */
const RIDER_ICON = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;border-radius:18px;background:${colors.primary};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:18px">🛵</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/**
 * Web: read-only Leaflet map with the rider, pickup and drop-off. It frames
 * all points until the customer pans or zooms; after that it leaves their
 * view alone and only moves the rider marker.
 */
export function TrackingMap({ rider, pickup, dropoff, height = 260 }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const hasUserMoved = useRef(false);

  useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) {
      return;
    }

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [dropoff.latitude, dropoff.longitude],
      MAX_FIT_ZOOM,
    );
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    map.on('dragstart', () => {
      hasUserMoved.current = true;
    });
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // Created once; marker changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;

    if (map === null || layer === null) {
      return;
    }

    layer.clearLayers();

    if (pickup !== null) {
      stop(pickup, PICKUP_COLOR, 'Pickup').addTo(layer);
    }

    stop(dropoff, colors.primaryDeep, 'Drop-off').addTo(layer);

    if (rider !== null) {
      L.marker([rider.latitude, rider.longitude], { icon: RIDER_ICON, title: 'Your rider' })
        .bindTooltip('Your rider')
        .addTo(layer);
    }

    if (!hasUserMoved.current) {
      const points = [rider, pickup, dropoff].filter((p): p is LatLng => p !== null);
      map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), {
        padding: FIT_PADDING,
        maxZoom: MAX_FIT_ZOOM,
        animate: false,
      });
    }
  }, [rider, pickup, dropoff]);

  return (
    <View style={[styles.frame, { height }]}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

function stop(point: LatLng, color: string, label: string): L.CircleMarker {
  return L.circleMarker([point.latitude, point.longitude], {
    radius: 9,
    color: '#ffffff',
    weight: 3,
    fillColor: color,
    fillOpacity: 1,
  }).bindTooltip(label);
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: 10, overflow: 'hidden' },
});
