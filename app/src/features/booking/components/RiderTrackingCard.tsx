import { StyleSheet, View } from 'react-native';

import { colors, fontSize, spacing } from '@/config/theme';
import { TrackingMap } from '@/features/map';
import { Card, Text } from '@/shared/ui';

import {
  isRiderTrackable,
  locationAgeLabel,
  secondsSince,
  separatePickup,
  STALE_LOCATION_SECONDS,
} from '../lib/riderTracking';
import type { Booking } from '../types';

/**
 * "Track your rider": the map with the rider, pickup and drop-off while a
 * rider is on the job. The booking query polls every 10 s, which moves the
 * marker and refreshes the "updated" line.
 */
export function RiderTrackingCard({ booking }: { booking: Booking }) {
  if (!isRiderTrackable(booking.status)) {
    return null;
  }

  const location = booking.rider_location ?? null;
  const riderName = booking.rider?.name ?? 'Your rider';
  const now = new Date();
  const isStale =
    location !== null && secondsSince(location.updated_at, now) > STALE_LOCATION_SECONDS;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Track your rider</Text>
        <Text variant="caption">
          {riderName} · {booking.status_label}
        </Text>
      </View>
      <TrackingMap
        rider={
          location === null ? null : { latitude: location.latitude, longitude: location.longitude }
        }
        pickup={separatePickup(booking)}
        dropoff={booking.dropoff.point}
      />
      <View style={styles.legend}>
        <LegendItem color={colors.primary} label="Rider" isRider />
        {separatePickup(booking) !== null && <LegendItem color={PICKUP_COLOR} label="Pickup" />}
        <LegendItem color={colors.primaryDeep} label="Drop-off" />
      </View>
      <Text variant="caption" style={isStale ? styles.stale : undefined}>
        {location === null
          ? 'Waiting for your rider’s location. It appears once their app reports in.'
          : isStale
            ? `Last known position. ${locationAgeLabel(location.updated_at, now)}; the rider may have lost signal.`
            : locationAgeLabel(location.updated_at, now)}
      </Text>
    </Card>
  );
}

function LegendItem({
  color,
  label,
  isRider = false,
}: {
  color: string;
  label: string;
  isRider?: boolean;
}) {
  return (
    <View style={styles.legendItem}>
      {isRider ? (
        <Text style={styles.legendRider}>🛵</Text>
      ) : (
        <View style={[styles.legendDot, { backgroundColor: color }]} />
      )}
      <Text variant="caption">{label}</Text>
    </View>
  );
}

const DOT_SIZE = 12;
/** Matches the pickup dot TrackingMap draws. */
const PICKUP_COLOR = '#F59E0B';

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  legendRider: { fontSize: fontSize.sm },
  card: { gap: spacing.sm },
  header: { gap: 2 },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primaryDeep },
  stale: { color: colors.danger },
});
