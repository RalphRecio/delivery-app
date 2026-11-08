import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/config/theme';

/**
 * Sign-in and register pages: a tinted canvas with the brand mark on top and
 * a centred column the panel fills. One layout for phones and desktop.
 */
export function AuthFrame({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.canvas} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  canvas: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    paddingVertical: spacing.xl,
  },
  column: { width: '100%', maxWidth: 440, gap: spacing.lg },
});
