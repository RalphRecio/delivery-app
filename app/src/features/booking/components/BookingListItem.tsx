import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { Text } from '@/shared/ui';

import type { Booking } from '../types';

import { BookingStatusBadge } from './BookingStatusBadge';

interface BookingListItemProps {
  booking: Booking;
  onPress: (booking: Booking) => void;
}

/** One booking in a list: service and reference, status, where it goes, the fare. */
export function BookingListItem({ booking, onPress }: BookingListItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${booking.service_label} ${booking.reference}`}
      onPress={() => onPress(booking)}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.titleText}>
          <Text style={styles.title} numberOfLines={1}>
            {booking.service_label}
          </Text>
          <Text variant="caption">
            {booking.reference} · {new Date(booking.created_at).toLocaleDateString()}
          </Text>
        </View>
        <BookingStatusBadge booking={booking} />
      </View>
      <View style={styles.route}>
        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
        <Text variant="caption" numberOfLines={1} style={styles.routeText}>
          {booking.dropoff.address}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.fare}>{booking.fare.total.formatted}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleText: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.md, fontWeight: '700' },
  route: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  routeText: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fare: { fontSize: fontSize.md, fontWeight: '800', color: colors.primaryDeep },
});
