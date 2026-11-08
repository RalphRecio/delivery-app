import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import type { ServiceOffering } from '@/features/booking';
import { Text } from '@/shared/ui';

interface ServiceCardProps {
  offering: ServiceOffering;
  onPress: (offering: ServiceOffering) => void;
}

/** One thing a customer can book, as a list row: icon tile, title, one line about it, chevron. */
export function ServiceCard({ offering, onPress }: ServiceCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Book ${offering.title}`}
      onPress={() => onPress(offering)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconTile}>
        <Ionicons name={offering.icon} size={24} color={colors.primaryPressed} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{offering.title}</Text>
        <Text style={styles.blurb} numberOfLines={2}>
          {offering.blurb}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surface },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  blurb: { fontSize: fontSize.sm, color: colors.textMuted },
});
