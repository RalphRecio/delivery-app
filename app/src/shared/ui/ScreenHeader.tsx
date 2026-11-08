import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fontSize, spacing } from '@/config/theme';

import { Text } from './Text';

interface ScreenHeaderProps {
  title: string;
  /** One quiet line under the title: a count ("3 bookings") or what the screen is for. */
  subtitle?: string;
  /** Right of the title, e.g. a status badge or an icon button. */
  trailing?: ReactNode;
}

/** The big heading at the top of a phone screen. */
export function ScreenHeader({ title, subtitle, trailing }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  text: { flex: 1, gap: 2 },
  title: {
    fontSize: fontSize.display,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.primaryDeep,
  },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted },
});
