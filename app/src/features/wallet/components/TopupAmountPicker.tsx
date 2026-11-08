import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';
import { Input, Text } from '@/shared/ui';

export const PRESET_AMOUNTS = ['100', '200', '500', '1000'] as const;

interface TopupAmountPickerProps {
  /** Pesos as typed, e.g. "500". */
  value: string;
  onChange: (pesos: string) => void;
  error?: string;
  hint: string;
  isDisabled?: boolean;
}

/** Four quick amounts, or type your own. */
export function TopupAmountPicker({
  value,
  onChange,
  error,
  hint,
  isDisabled = false,
}: TopupAmountPickerProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {PRESET_AMOUNTS.map((amount) => {
          const isSelected = value === amount;

          return (
            <Pressable
              key={amount}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected, disabled: isDisabled }}
              accessibilityLabel={`₱${Number(amount).toLocaleString('en-PH')}`}
              disabled={isDisabled}
              onPress={() => onChange(amount)}
              style={[styles.preset, isSelected && styles.presetSelected]}
            >
              <Text style={[styles.presetText, isSelected && styles.presetTextSelected]}>
                ₱{Number(amount).toLocaleString('en-PH')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Input
        label="Or enter an amount (₱)"
        placeholder="e.g. 750"
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
        error={error}
        hint={hint}
        editable={!isDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  presetSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySoft,
  },
  presetText: { fontWeight: '700', fontSize: 18 },
  presetTextSelected: { color: colors.primaryPressed },
});
