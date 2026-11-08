import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { Text } from '@/shared/ui';

import type { TopupRequest } from '../types';

const LOOK = {
  pending: {
    icon: 'time-outline',
    color: colors.text,
    background: colors.warningSoft,
    title: 'Waiting for payment',
  },
  paid: {
    icon: 'checkmark-circle',
    color: colors.success,
    background: colors.successSoft,
    title: 'Top-up successful',
  },
  failed: {
    icon: 'close-circle',
    color: colors.danger,
    background: colors.dangerSoft,
    title: 'Payment failed',
  },
  expired: {
    icon: 'hourglass-outline',
    color: colors.danger,
    background: colors.dangerSoft,
    title: 'Top-up expired',
  },
} as const;

/** The result after checkout: success, still waiting, or failed/expired, with the amount and reference. */
export function TopupStatusView({ topup }: { topup: TopupRequest }) {
  const look = LOOK[topup.status];
  const detail =
    topup.status === 'paid'
      ? `${topup.amount.formatted} was added to your wallet.`
      : topup.status === 'pending'
        ? 'We have not received confirmation from GCash/Maya yet. This updates on its own; it usually takes a few seconds after you pay.'
        : topup.status === 'failed'
          ? (topup.failure_reason ?? 'The payment did not go through. You were not charged.')
          : 'This top-up was not paid in time. If money left your account, it will still be credited once GCash/Maya confirms.';

  return (
    <View
      style={[styles.panel, { backgroundColor: look.background }]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={look.icon} size={48} color={look.color} />
      <Text style={[styles.title, { color: look.color }]}>{look.title}</Text>
      <Text style={styles.amount}>{topup.amount.formatted}</Text>
      <Text style={styles.detail}>{detail}</Text>
      <Text variant="caption" selectable>
        Reference {topup.reference}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg },
  title: { fontSize: fontSize.lg, fontWeight: '800' },
  amount: { fontSize: fontSize.xl, fontWeight: '800' },
  detail: { textAlign: 'center' },
});
