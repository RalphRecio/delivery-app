import { Ionicons } from '@expo/vector-icons';
import { useId } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';

import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Keeps the label for screen readers only, e.g. a search box in a toolbar. */
  hideLabel?: boolean;
  /** `compact` is the 36 px console field; the default 50 px suits touch screens. */
  size?: 'default' | 'compact';
  /** Leading icon inside the field, e.g. a magnifier on a search box. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Shown under the field in red; also sets the invalid accessibility state. */
  error?: string;
  hint?: string;
}

export function Input({
  label,
  hideLabel = false,
  size = 'default',
  icon,
  error,
  hint,
  ...props
}: InputProps) {
  const labelId = useId();
  const hasError = error !== undefined;

  return (
    <View style={styles.container}>
      {!hideLabel && (
        <Text nativeID={labelId} style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.field}>
        {icon !== undefined && (
          <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          accessibilityLabel={label}
          accessibilityLabelledBy={labelId}
          accessibilityState={{ disabled: props.editable === false }}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            size === 'compact' && styles.inputCompact,
            icon !== undefined && styles.inputWithIcon,
            hasError && styles.inputError,
          ]}
          {...props}
        />
      </View>
      {hasError ? (
        <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint !== undefined ? (
        <Text variant="caption">{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  field: { justifyContent: 'center' },
  icon: { position: 'absolute', left: spacing.md, zIndex: 1 },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontSize: fontSize.md,
    color: colors.text,
  },
  // The console's field: slate border, tighter height.
  inputCompact: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderColor: '#CBD5E1',
    fontSize: 14,
  },
  inputWithIcon: { paddingLeft: spacing.md + 26 },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger },
});
