import { Ionicons } from '@expo/vector-icons';
import { useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';

import { Text } from './Text';

interface DisclosureProps {
  title: string;
  /** Shown under the title while closed, so the user knows what is inside. */
  hint?: string;
  defaultOpen?: boolean;
  /** Keeps the section open regardless of the toggle, e.g. a field inside has an error. */
  isForcedOpen?: boolean;
}

/**
 * A section the user opens on demand, for optional fields that would
 * otherwise crowd a form.
 */
export function Disclosure({
  title,
  hint,
  defaultOpen = false,
  isForcedOpen = false,
  children,
}: PropsWithChildren<DisclosureProps>) {
  const [isToggledOpen, setIsToggledOpen] = useState(defaultOpen);
  const isOpen = isForcedOpen || isToggledOpen;

  return (
    <View style={styles.frame}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsToggledOpen((current) => !current)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {hint !== undefined && !isOpen && <Text variant="caption">{hint}</Text>}
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {isOpen && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  headerPressed: { backgroundColor: colors.surface },
  headerText: { flex: 1, gap: spacing.xs },
  title: { fontWeight: '600' },
  body: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
