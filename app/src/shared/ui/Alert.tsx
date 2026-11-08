import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';

import { Text } from './Text';

type Tone = 'error' | 'info';

interface AlertProps {
  tone?: Tone;
  message: string;
}

/** Form-level message (not tied to one field): a failed request, an offline notice. */
export function Alert({ tone = 'info', message }: AlertProps) {
  return (
    <View accessibilityRole="alert" style={[styles.base, styles[tone]]}>
      <Text style={tone === 'error' ? styles.textError : undefined}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { padding: spacing.md, borderRadius: radius.md },
  info: { backgroundColor: colors.surface },
  error: { backgroundColor: colors.dangerSoft },
  textError: { color: colors.danger },
});
