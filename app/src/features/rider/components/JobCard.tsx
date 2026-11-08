import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, shadow, spacing } from '@/config/theme';
import { BookingStatusBadge, resolveOffering } from '@/features/booking';
import { formatDistance } from '@/shared/lib/format';
import { Text } from '@/shared/ui';

import type { Job } from '../types';

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
}

/** One offer (or the active job) in a list: what, where, how far, how much. */
export function JobCard({ job, onPress }: JobCardProps) {
  const icon =
    resolveOffering(job.service_type, job.pabili_category ?? undefined)?.icon ?? 'bicycle';
  const pickup =
    job.pickup.landmark !== null
      ? `${job.pickup.address} (${job.pickup.landmark})`
      : job.pickup.address;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${job.service_label} ${job.reference}`}
      onPress={() => onPress(job)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={22} color={colors.primaryPressed} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.service} numberOfLines={1}>
            {job.service_label}
          </Text>
          <Text variant="caption">{job.reference}</Text>
        </View>
        <Text style={styles.fare}>{job.fare.total.formatted}</Text>
      </View>

      <View style={styles.route}>
        <Stop color={colors.primary} label="Pickup" address={pickup} />
        <View style={styles.connector} />
        <Stop color={colors.danger} label="Drop-off" address={job.dropoff.address} />
      </View>

      <View style={styles.footer}>
        {job.distance_to_pickup_meters !== undefined && (
          <Chip
            icon="navigate-outline"
            label={`${formatDistance(job.distance_to_pickup_meters)} away`}
          />
        )}
        <Chip icon="swap-vertical" label={`${formatDistance(job.fare.distance_meters)} trip`} />
        <View style={styles.spacer} />
        <BookingStatusBadge booking={job} />
      </View>
    </Pressable>
  );
}

function Stop({ color, label, address }: { color: string; label: string; address: string }) {
  return (
    <View style={styles.stop}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.stopText}>
        <Text style={styles.stopLabel}>{label}</Text>
        <Text numberOfLines={1}>{address}</Text>
      </View>
    </View>
  );
}

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={colors.primaryDeep} />
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const DOT_SIZE = 10;

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    ...shadow.card,
  },
  pressed: { backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  service: { fontSize: fontSize.md, fontWeight: '700', color: colors.primaryDeep },
  fare: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primaryPressed },
  route: { gap: 2 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  // A short line between the two dots, so pickup and drop-off read as one route.
  connector: {
    width: 2,
    height: spacing.sm,
    marginLeft: DOT_SIZE / 2 - 1,
    backgroundColor: colors.border,
  },
  stopText: { flex: 1 },
  stopLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4 },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  spacer: { flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primaryDeep },
});
