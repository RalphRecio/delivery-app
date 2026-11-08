import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { APP_NAME } from '@/config/brand';
import { colors, fontSize, radius, shadow, spacing } from '@/config/theme';
import { Text } from '@/shared/ui';

// shortcut: drawn from the theme icon because no logo file exists yet; swap for an <Image> once one is supplied.
/** The green tile and wordmark that heads every auth page. */
export function BrandMark() {
  return (
    <View style={styles.container} accessibilityRole="header" accessibilityLabel={APP_NAME}>
      <View style={styles.tile}>
        <Ionicons name="bicycle" size={34} color={colors.onPrimary} />
      </View>
      <Text style={styles.name}>{APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm },
  tile: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  name: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primaryDeep },
});
