import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { useCurrentUser } from '@/features/auth';
import { filipinoGreeting } from '@/shared/lib/format';
import { Text } from '@/shared/ui';

/** The pinned green bar on the rider home: avatar and greeting. Sign out lives in Settings. */
export function RiderHeader() {
  const me = useCurrentUser();
  const firstName = me.data?.first_name;

  return (
    <View style={styles.bar}>
      <View style={styles.avatar}>
        {firstName !== undefined ? (
          <Text style={styles.initial}>{firstName.charAt(0).toUpperCase()}</Text>
        ) : (
          <Ionicons name="person" size={20} color={colors.primaryDeep} />
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.greeting} numberOfLines={1} accessibilityRole="header">
          {filipinoGreeting(new Date())}
          {firstName !== undefined ? `, ${firstName}` : ''}!
        </Text>
        <Text style={styles.subtitle}>Rider</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primaryDeep },
  text: { flex: 1, gap: 2 },
  greeting: { color: colors.onPrimary, fontSize: fontSize.lg, fontWeight: '800' },
  subtitle: { color: colors.onPrimary, opacity: 0.85, fontSize: fontSize.sm },
});
