import { StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize } from '@/config/adminTheme';
import { formatPhilippineMobile } from '@/features/auth';
import { formatDistance } from '@/shared/lib/format';
import { Text } from '@/shared/ui';

import type { DispatchCandidate } from '../types';
import { AdminButton, StatusPill } from '../ui';

interface RiderCandidateRowProps {
  candidate: DispatchCandidate;
  /** First tap arms the row, second tap assigns: the job starts at once, so no accidental taps. */
  isConfirming: boolean;
  isAssigning: boolean;
  isDisabled: boolean;
  onAssign: () => void;
}

export function RiderCandidateRow({
  candidate,
  isConfirming,
  isAssigning,
  isDisabled,
  onAssign,
}: RiderCandidateRowProps) {
  const { rider } = candidate;
  const distance =
    candidate.distance_to_pickup_meters === null
      ? 'Location not shared yet'
      : `${formatDistance(candidate.distance_to_pickup_meters)} from pickup`;

  return (
    <View style={styles.row} accessibilityLabel={`Rider ${rider.name ?? rider.id}`}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(rider.name)}</Text>
        <View style={[styles.presence, candidate.is_on_duty && styles.presenceOnDuty]} />
      </View>
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{rider.name ?? 'No name yet'}</Text>
          <StatusPill
            label={candidate.is_on_duty ? 'On duty' : 'Offline'}
            tone={candidate.is_on_duty ? 'green' : 'gray'}
          />
          {!candidate.is_available && (
            <StatusPill label={candidate.unavailable_reason ?? 'Busy'} tone="amber" />
          )}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {distance}
          {rider.phone !== null && ` · ${formatPhilippineMobile(rider.phone)}`}
          {` · Wallet ${candidate.wallet_balance.formatted}`}
        </Text>
      </View>
      {candidate.is_available && (
        <AdminButton
          variant={isConfirming ? 'primary' : 'outline'}
          label={isConfirming ? 'Confirm' : 'Assign'}
          onPress={onAssign}
          isLoading={isAssigning}
          disabled={isDisabled}
        />
      )}
    </View>
  );
}

function initials(name: string | null): string {
  if (name === null || name.trim() === '') {
    return '?';
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '600', color: adminColors.brand, fontSize: adminFontSize.sm },
  presence: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: adminColors.surface,
    backgroundColor: adminColors.borderStrong,
  },
  presenceOnDuty: { backgroundColor: '#16A34A' },
  text: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: adminFontSize.base, fontWeight: '600', color: adminColors.text },
  meta: { fontSize: adminFontSize.sm, color: adminColors.textMuted },
});
