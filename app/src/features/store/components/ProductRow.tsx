import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { Text } from '@/shared/ui';

import type { StoreProduct } from '../types';

interface ProductRowProps {
  product: StoreProduct;
  quantity: number;
  onChange: (quantity: number) => void;
}

/** A menu line with a Grab-style add button that turns into a − n + stepper. */
export function ProductRow({ product, quantity, onChange }: ProductRowProps) {
  return (
    <View style={styles.row} accessibilityLabel={`Product ${product.name}`}>
      <View style={styles.text}>
        <Text style={styles.name}>{product.name}</Text>
        {product.description !== null && <Text variant="caption">{product.description}</Text>}
        <Text style={styles.price}>{product.price.formatted}</Text>
      </View>
      {quantity === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name}`}
          onPress={() => onChange(1)}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={20} color={colors.onPrimary} />
        </Pressable>
      ) : (
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove one ${product.name}`}
            onPress={() => onChange(quantity - 1)}
            style={styles.stepButton}
          >
            <Ionicons
              name={quantity === 1 ? 'trash-outline' : 'remove'}
              size={18}
              color={colors.primaryPressed}
            />
          </Pressable>
          <Text style={styles.quantity} accessibilityLabel={`${product.name} quantity ${quantity}`}>
            {quantity}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add one more ${product.name}`}
            onPress={() => onChange(quantity + 1)}
            style={styles.stepButton}
          >
            <Ionicons name="add" size={18} color={colors.primaryPressed} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  text: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
  price: { color: colors.primaryPressed, fontWeight: '600', fontSize: fontSize.sm },
  add: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  stepButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 24, textAlign: 'center', fontWeight: '700' },
});
