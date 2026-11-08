import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { adminColors } from '@/config/adminTheme';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import { Text } from './Text';

export interface ChipOption<TValue extends string> {
  value: TValue | undefined;
  label: string;
}

interface FilterChipsProps<TValue extends string> {
  options: ChipOption<TValue>[];
  selected: TValue | undefined;
  onSelect: (value: TValue | undefined) => void;
  /** Wrap onto several lines (wide screens) instead of scrolling sideways (phones). */
  wrap?: boolean;
  /** `console` is the admin look: slate border, indigo tint when selected. */
  variant?: 'default' | 'console';
}

/** A row of single-select filter chips; `undefined` means "all". */
export function FilterChips<TValue extends string>({
  options,
  selected,
  onSelect,
  wrap = false,
  variant = 'default',
}: FilterChipsProps<TValue>) {
  const isConsole = variant === 'console';
  const chips = options.map((option) => {
    const isSelected = option.value === selected;

    return (
      <Pressable
        key={option.value ?? 'all'}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        onPress={() => onSelect(option.value)}
        style={[
          styles.chip,
          isConsole && styles.chipConsole,
          isSelected && (isConsole ? styles.chipConsoleSelected : styles.chipSelected),
        ]}
      >
        <Text
          style={[
            styles.label,
            isConsole && styles.labelConsole,
            isSelected && (isConsole ? styles.labelConsoleSelected : styles.labelSelected),
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (wrap) {
    return <View style={[styles.row, styles.wrap]}>{chips}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipConsole: {
    paddingVertical: 6,
    borderRadius: 6,
    borderColor: adminColors.borderStrong,
    backgroundColor: adminColors.surface,
  },
  chipConsoleSelected: { backgroundColor: adminColors.brandSoft, borderColor: adminColors.brand },
  labelConsole: { color: adminColors.textSecondary },
  labelConsoleSelected: { color: adminColors.brand },
  label: { fontSize: fontSize.md - 1, fontWeight: '700', color: colors.text },
  labelSelected: { color: colors.onPrimary },
});
