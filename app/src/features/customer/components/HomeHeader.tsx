import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { APP_NAME } from '@/config/brand';
import { colors, fontSize, spacing } from '@/config/theme';
import { Logo, Text } from '@/shared/ui';

interface HomeHeaderProps {
  /** The bell; there is no notification inbox yet, so the screen decides where it goes. */
  onBellPress: () => void;
}

/** The green brand banner at the top of the customer home: wordmark left, bell right. */
export function HomeHeader({ onBellPress }: HomeHeaderProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.brand}>
        {/* White ring so the green badge stands out on the green banner. */}
        <View style={styles.logoRing}>
          <Logo size={36} />
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {APP_NAME}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Booking updates"
        onPress={onBellPress}
        hitSlop={8}
        style={styles.bell}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoRing: { padding: 2, borderRadius: 20, backgroundColor: colors.onPrimary },
  name: { color: colors.onPrimary, fontSize: fontSize.lg + 2, fontWeight: '800' },
  bell: { padding: spacing.xs },
});
