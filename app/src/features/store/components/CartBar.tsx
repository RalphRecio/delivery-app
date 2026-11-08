import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, shadow, spacing } from '@/config/theme';
import { formatMoney } from '@/shared/lib/format';
import { Text } from '@/shared/ui';

interface CartBarProps {
  count: number;
  subtotalCentavos: number;
  onPress: () => void;
}

/** The sticky "n items · ₱subtotal · Continue" bar at the bottom of a store page. */
export function CartBar({ count, subtotalCentavos, onPress }: CartBarProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue to booking"
      onPress={onPress}
      style={styles.bar}
    >
      <View style={styles.count}>
        <Text style={styles.countText}>{count}</Text>
      </View>
      <Text style={styles.label}>
        {count === 1 ? '1 item' : `${count} items`} · {formatMoney(subtotalCentavos)}
      </Text>
      <Text style={styles.cta}>Continue</Text>
      <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadow.card,
  },
  count: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: colors.primaryPressed, fontWeight: '700', fontSize: fontSize.sm },
  label: { flex: 1, color: colors.onPrimary, fontWeight: '600' },
  cta: { color: colors.onPrimary, fontWeight: '700' },
});
