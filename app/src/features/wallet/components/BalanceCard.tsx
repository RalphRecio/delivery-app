import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { Button, Text } from '@/shared/ui';

import type { WalletSummary } from '../types';

import { LowBalanceAlert } from './LowBalanceAlert';

interface BalanceCardProps {
  wallet: WalletSummary;
  onTopUp: () => void;
  /** Smaller variant for the rider home; the wallet screen shows the full one. */
  isCompact?: boolean;
  onOpen?: () => void;
}

/** The balance, big, with the minimum and a top-up button. */
export function BalanceCard({ wallet, onTopUp, isCompact = false, onOpen }: BalanceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={22} color={colors.onPrimary} />
        <Text style={styles.label}>Wallet balance</Text>
      </View>
      <Text style={[styles.balance, isCompact && styles.balanceCompact]} accessibilityRole="header">
        {wallet.balance.formatted}
      </Text>
      <Text style={styles.minimum}>
        {isCompact
          ? `Keep at least ${wallet.minimum_balance.formatted} to accept jobs.`
          : `Keep at least ${wallet.minimum_balance.formatted} to accept jobs. Commission is deducted here when you complete a cash booking.`}
      </Text>
      {!wallet.can_accept_bookings && (
        <LowBalanceAlert wallet={wallet} onTopUp={onTopUp} isOnDark />
      )}
      <View style={styles.actions}>
        {wallet.can_accept_bookings && (
          <View style={styles.action}>
            <Button variant="secondary" label="Top up" onPress={onTopUp} />
          </View>
        )}
        {onOpen !== undefined && (
          <View style={styles.action}>
            <Button variant="secondary" label="Open wallet" onPress={onOpen} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { color: colors.onPrimary, fontWeight: '600' },
  balance: { color: colors.onPrimary, fontSize: 40, fontWeight: '800' },
  balanceCompact: { fontSize: fontSize.xl + 4 },
  minimum: { color: colors.onPrimary, opacity: 0.9, fontSize: fontSize.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
