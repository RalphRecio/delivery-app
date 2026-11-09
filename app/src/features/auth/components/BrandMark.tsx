import { StyleSheet, View } from 'react-native';

import { APP_NAME } from '@/config/brand';
import { colors, fontSize, spacing } from '@/config/theme';
import { Logo, Text } from '@/shared/ui';

/** The logo badge and wordmark that heads every auth page. */
export function BrandMark() {
  return (
    <View style={styles.container} accessibilityRole="header" accessibilityLabel={APP_NAME}>
      <Logo size={96} />
      <Text style={styles.name}>{APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm },
  name: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primaryDeep },
});
