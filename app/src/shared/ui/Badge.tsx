import { StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';

import { Text } from './Text';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[tone]]}>
      <Text style={[styles.label, styles[`${tone}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  label: { fontSize: fontSize.sm, fontWeight: '600' },
  neutral: { backgroundColor: colors.border },
  neutralLabel: { color: colors.text },
  info: { backgroundColor: colors.warningSoft },
  infoLabel: { color: '#8A5A00' },
  success: { backgroundColor: colors.successSoft },
  successLabel: { color: colors.success },
  danger: { backgroundColor: colors.dangerSoft },
  dangerLabel: { color: colors.danger },
});
