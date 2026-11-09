import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { formatMoney } from '@/shared/lib/format';
import { Card, Text } from '@/shared/ui';
import { selectCartSubtotalCentavos, useCartLines, useCartStore } from '@/stores/cartStore';

interface OrderSummaryProps {
  onChangeStore: () => void;
  editable?: boolean;
}

/**
 * The store and the lines in the cart, with steppers, shown on the booking form.
 * A store without a menu has no lines: the customer types the list instead.
 */
export function OrderSummary({ onChangeStore, editable = true }: OrderSummaryProps) {
  const store = useCartStore((state) => state.store);
  const lines = useCartLines();
  const subtotal = useCartStore(selectCartSubtotalCentavos);
  const setQuantity = useCartStore((state) => state.setQuantity);

  if (store === null) {
    return null;
  }

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="storefront" size={18} color={colors.primaryPressed} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text variant="caption" numberOfLines={1}>
            {store.address}
          </Text>
        </View>
        {editable && (
          <Pressable accessibilityRole="button" onPress={onChangeStore} style={styles.change}>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        )}
      </View>
      <Text variant="caption">The rider picks up at this store; its address is the pickup.</Text>
      {lines.length === 0 ? (
        <Text variant="caption">Type what you want below and the rider buys it here.</Text>
      ) : (
        <>
          <View style={styles.lines}>
            {lines.map(({ product, quantity }) => (
              <View
                key={product.id}
                style={styles.line}
                accessibilityLabel={`Order line ${product.name}`}
              >
                <View style={styles.lineText}>
                  <Text style={styles.lineName}>{product.name}</Text>
                  <Text variant="caption">{formatMoney(product.priceCentavos)} each</Text>
                </View>
                {editable ? (
                  <View style={styles.stepper}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove one ${product.name}`}
                      onPress={() => setQuantity(product, quantity - 1)}
                      style={styles.stepButton}
                    >
                      <Ionicons
                        name={quantity === 1 ? 'trash-outline' : 'remove'}
                        size={16}
                        color={colors.primaryPressed}
                      />
                    </Pressable>
                    <Text style={styles.quantity}>{quantity}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Add one more ${product.name}`}
                      onPress={() => setQuantity(product, quantity + 1)}
                      style={styles.stepButton}
                    >
                      <Ionicons name="add" size={16} color={colors.primaryPressed} />
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.quantity}>×{quantity}</Text>
                )}
                <Text style={styles.lineTotal}>
                  {formatMoney(product.priceCentavos * quantity)}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.subtotal}>
            <Text style={styles.subtotalLabel}>Items subtotal</Text>
            <Text style={styles.subtotalValue}>{formatMoney(subtotal)}</Text>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  storeName: { fontWeight: '700', fontSize: fontSize.md },
  change: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  changeText: { color: colors.primaryPressed, fontWeight: '600' },
  lines: { gap: spacing.xs },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lineText: { flex: 1 },
  lineName: { fontWeight: '600' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  stepButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 22, textAlign: 'center', fontWeight: '700' },
  lineTotal: { minWidth: 72, textAlign: 'right', fontWeight: '600' },
  subtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  subtotalLabel: { fontWeight: '600' },
  subtotalValue: { fontWeight: '700' },
});
