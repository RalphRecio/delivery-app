import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  /** `sm` fits inside table rows and card headers. */
  size?: Size;
  /** Leading icon, e.g. a funnel on a Filter button. */
  icon?: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || isLoading;
  const isFilled = variant === 'primary' || variant === 'danger';
  const iconColor = isFilled
    ? colors.onPrimary
    : variant === 'ghost'
      ? colors.primaryPressed
      : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === 'sm' && styles.small,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isFilled ? colors.onPrimary : colors.primary} />
      ) : (
        <>
          {icon !== undefined && (
            <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={iconColor} />
          )}
          <Text
            style={[
              styles.label,
              size === 'sm' && styles.labelSmall,
              isFilled ? styles.labelFilled : styles.labelSecondary,
              variant === 'ghost' && styles.labelGhost,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { minHeight: 36, paddingHorizontal: spacing.md },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  secondary: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { fontSize: fontSize.md, fontWeight: '700' },
  labelSmall: { fontSize: fontSize.sm },
  labelFilled: { color: colors.onPrimary },
  labelSecondary: { color: colors.text },
  labelGhost: { color: colors.primaryPressed },
});
