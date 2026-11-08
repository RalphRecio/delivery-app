import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, shadow, spacing } from '@/config/theme';
import { formatDistance } from '@/shared/lib/format';
import { Badge, Text } from '@/shared/ui';

import type { Store, StoreCategory } from '../types';

const ICONS: Record<StoreCategory, keyof typeof Ionicons.glyphMap> = {
  grocery: 'cart-outline',
  pharmacy: 'medkit-outline',
  restaurant: 'restaurant-outline',
  convenience: 'storefront-outline',
  bakery: 'cafe-outline',
  other: 'bag-handle-outline',
};

interface StoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
}

export function StoreCard({ store, onPress }: StoreCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Store ${store.name}`}
      onPress={() => onPress(store)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name={ICONS[store.category]} size={24} color={colors.primaryPressed} />
      </View>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {store.name}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {store.address}
        </Text>
        <View style={styles.meta}>
          <Badge label={store.category_label} tone="neutral" />
          {store.distance_meters !== undefined && (
            <Text variant="caption">{formatDistance(store.distance_meters)} away</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  pressed: { backgroundColor: colors.surface },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: spacing.xs },
  name: { fontSize: fontSize.md, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
