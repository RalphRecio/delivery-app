import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';

import { Text } from './Text';

interface BackBarProps {
  /** Where to go when there is no history, e.g. the page was opened from a link or refreshed. */
  fallbackHref: Href;
  label?: string;
}

/**
 * The back control at the top of a phone screen. Imported from its own path
 * (not the ui index) because it depends on expo-router. Render it outside the
 * screen's ScrollView so it stays put while the content scrolls.
 */
export function BackBar({ fallbackHref, label = 'Back' }: BackBarProps) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace(fallbackHref));

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={goBack}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.primaryPressed} />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', minHeight: 44, alignItems: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radius.pill,
  },
  pressed: { opacity: 0.6 },
  label: { fontSize: fontSize.md, fontWeight: '600', color: colors.primaryPressed },
});
