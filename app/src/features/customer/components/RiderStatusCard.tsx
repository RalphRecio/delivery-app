import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { TERMINAL_STATUSES, useBookings, type Booking } from '@/features/booking';
import { Button, Text } from '@/shared/ui';

import { useRidersOnDuty } from '../hooks/useRidersOnDuty';
import { ridersOnDutyLabel, riderStatusPill } from '../lib/riderStatus';

interface RiderStatusCardProps {
  onOpenBooking: (booking: Booking) => void;
}

/**
 * Riders on duty in the service area, then one row per booking still in
 * progress: who the rider is and where they are in the job. Other riders'
 * identities are never shown; only the count.
 */
export function RiderStatusCard({ onOpenBooking }: RiderStatusCardProps) {
  const riders = useRidersOnDuty();
  const bookings = useBookings();
  const active = (bookings.data ?? []).filter((b) => !TERMINAL_STATUSES.includes(b.status));

  const subtitle = riders.isPending
    ? 'Checking riders…'
    : riders.isError
      ? 'Rider count unavailable'
      : `${riders.data.service_area} • ${ridersOnDutyLabel(riders.data.riders_on_duty)}`;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="bicycle" size={28} color={colors.primaryDeep} />
        <View style={styles.titleText}>
          <Text style={styles.title}>Rider Assignment Status</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {riders.isError && (
        <Button variant="ghost" label="Retry" onPress={() => void riders.refetch()} />
      )}

      {bookings.isPending ? (
        <Text variant="caption">Loading your bookings…</Text>
      ) : bookings.isError ? (
        <View style={styles.row}>
          <Text variant="caption" style={styles.flex}>
            Could not load your bookings.
          </Text>
          <Button variant="ghost" label="Retry" onPress={() => void bookings.refetch()} />
        </View>
      ) : active.length === 0 ? (
        <Text variant="caption">
          No active booking. Book below and the nearest rider on duty takes it.
        </Text>
      ) : (
        active.map((booking) => (
          <ActiveBookingRow key={booking.id} booking={booking} onPress={onOpenBooking} />
        ))
      )}
    </View>
  );
}

function ActiveBookingRow({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress: (booking: Booking) => void;
}) {
  const riderName = booking.rider?.name ?? null;
  const initial = riderName?.trim().charAt(0).toUpperCase() ?? '?';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${booking.service_label} ${booking.reference}, ${booking.status_label}`}
      onPress={() => onPress(booking)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.flex}>
        <Text numberOfLines={1}>
          <Text style={styles.riderName}>{riderName ?? 'Finding a rider'}</Text>
          {riderName !== null ? ` • ${booking.status_label}` : ''}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {booking.service_label} · {booking.reference}
        </Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{riderStatusPill(booking.status)}</Text>
      </View>
    </Pressable>
  );
}

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleText: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primaryDeep },
  subtitle: { color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.sm },
  pressed: { backgroundColor: colors.primarySoft },
  flex: { flex: 1 },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onPrimary, fontSize: fontSize.lg, fontWeight: '800' },
  riderName: { fontWeight: '800', color: colors.primaryDeep },
  pill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  pillText: { fontSize: fontSize.sm, color: colors.primaryDeep, fontWeight: '600' },
});
