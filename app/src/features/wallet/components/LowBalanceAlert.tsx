import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';
import { Button, Text } from '@/shared/ui';

import type { WalletSummary } from '../types';

interface LowBalanceAlertProps {
  /** The wallet if known; otherwise just the server's message (e.g. from a refused accept). */
  wallet?: WalletSummary;
  message?: string;
  onTopUp: () => void;
  isOnDark?: boolean;
}

/** "You can't accept jobs until you top up", with the button to do it. */
export function LowBalanceAlert({
  wallet,
  message,
  onTopUp,
  isOnDark = false,
}: LowBalanceAlertProps) {
  const text =
    message ??
    (wallet === undefined
      ? 'Top up your wallet to accept jobs.'
      : `You need ${wallet.shortfall.formatted} more to accept jobs (minimum ${wallet.minimum_balance.formatted}).`);

  return (
    <View style={[styles.banner, isOnDark && styles.bannerOnDark]} accessibilityRole="alert">
      <View style={styles.row}>
        <Ionicons name="warning-outline" size={20} color={colors.danger} />
        <Text style={styles.text}>{text}</Text>
      </View>
      <Button label="Top up" onPress={onTopUp} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  bannerOnDark: { backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  text: { flex: 1, color: colors.danger, fontWeight: '600' },
});
