import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';

import { Text } from './Text';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  /** What to do about it: "Try another search", "Book a Pasuyo to see it here". */
  hint?: string;
  /** Usually a Button that leads somewhere useful. */
  action?: ReactNode;
}

/** Centred "nothing here" message with an icon, used by lists and placeholders. */
export function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <View style={styles.frame}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={30} color={colors.primaryDeep} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}
      {action !== undefined && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl * 1.5 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, textAlign: 'center' },
  hint: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', maxWidth: 320 },
  action: { marginTop: spacing.sm, minWidth: 200 },
});
