import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { adminColors, adminFontSize, adminRadius } from '@/config/adminTheme';
import { Text } from '@/shared/ui';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface AdminButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  /** `md` is the console default (32 px); `lg` (36 px) for form submits. */
  size?: Size;
  icon?: ComponentProps<typeof Ionicons>['name'];
  isLoading?: boolean;
}

/** Compact console button: indigo for the main action, outlined for the rest. */
export function AdminButton({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  disabled,
  ...props
}: AdminButtonProps) {
  const isDisabled = disabled === true || isLoading;
  const isFilled = variant === 'primary' || variant === 'danger';
  const textColor = isFilled ? '#FFFFFF' : adminColors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === 'lg' && styles.large,
        pressed && (variant === 'primary' ? styles.primaryPressed : styles.pressed),
        isDisabled && styles.disabled,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon !== undefined && <Ionicons name={icon} size={15} color={textColor} />}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: adminRadius.button,
  },
  large: { height: 36, paddingHorizontal: 16 },
  primary: { backgroundColor: adminColors.brand },
  primaryPressed: { backgroundColor: adminColors.brandHover },
  danger: { backgroundColor: adminColors.danger },
  outline: {
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.borderStrong,
  },
  ghost: { backgroundColor: 'transparent' },
  pressed: { backgroundColor: adminColors.surfaceMuted },
  disabled: { opacity: 0.5 },
  label: { fontSize: adminFontSize.md, fontWeight: '500' },
});
