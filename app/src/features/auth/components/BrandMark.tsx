import { StyleSheet, View } from 'react-native';

import { APP_NAME } from '@/config/brand';
import { spacing } from '@/config/theme';
import { Logo } from '@/shared/ui';

/** The logo badge that heads every auth page; the name is already printed inside it. */
export function BrandMark() {
  return (
    <View style={styles.container} accessibilityRole="header" accessibilityLabel={APP_NAME}>
      <Logo size={140} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm },
});
