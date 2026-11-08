import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';
import { Text } from '@/shared/ui';

import { signedAmount, transactionMeta } from '../lib/transactionMeta';
import type { WalletTransaction } from '../types';

/** One ledger line; tap to see what it relates to (booking, payment reference, reason). */
export function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const [isOpen, setIsOpen] = useState(false);
  const meta = transactionMeta(transaction.type);
  const time = new Date(transaction.created_at).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      accessibilityLabel={`${meta.label} ${signedAmount(transaction)}`}
      onPress={() => setIsOpen((open) => !open)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.main}>
        <View style={[styles.icon, { backgroundColor: meta.background }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{meta.label}</Text>
          <Text variant="caption" numberOfLines={1}>
            {transaction.booking !== null
              ? `Booking ${transaction.booking.reference}`
              : transaction.topup !== null
                ? 'GCash / Maya'
                : (transaction.reason ?? '')}{' '}
            · {time}
          </Text>
        </View>
        <Text style={[styles.amount, { color: meta.color }]}>{signedAmount(transaction)}</Text>
      </View>

      {isOpen && (
        <View style={styles.details}>
          {transaction.booking !== null && (
            <>
              <Detail label="Booking" value={transaction.booking.reference} />
              <Detail label="Fare" value={transaction.booking.total_fare.formatted} />
              {transaction.booking.commission_rate_bps !== null && (
                <Detail
                  label="Commission rate"
                  value={`${transaction.booking.commission_rate_bps / 100}%`}
                />
              )}
            </>
          )}
          {transaction.topup !== null && (
            <Detail label="Payment reference" value={transaction.topup.reference} />
          )}
          {transaction.reason !== null && <Detail label="Reason" value={transaction.reason} />}
          <Detail label="Transaction no." value={String(transaction.id)} />
          <Detail label="Date" value={new Date(transaction.created_at).toLocaleString('en-PH')} />
        </View>
      )}
    </Pressable>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text variant="caption">{label}</Text>
      <Text style={styles.detailValue} selectable>
        {value}
      </Text>
    </View>
  );
}

const ICON_SIZE = 38;

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.surface },
  main: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontWeight: '600' },
  amount: { fontWeight: '700' },
  details: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  detailValue: { flexShrink: 1, textAlign: 'right', fontWeight: '600' },
});
