import { Text as NativeText, StyleSheet, type TextProps as NativeTextProps } from 'react-native';

import { colors, fontSize } from '@/config/theme';

/**
 * title: page or screen name. heading: a card or section name.
 * label: small muted caps above a value, for dense admin cards.
 */
type Variant = 'title' | 'heading' | 'label' | 'body' | 'caption';

interface TextProps extends NativeTextProps {
  variant?: Variant;
}

export function Text({ variant = 'body', style, ...props }: TextProps) {
  return <NativeText style={[styles.base, styles[variant], style]} {...props} />;
}

const styles = StyleSheet.create({
  base: { color: colors.text },
  title: { fontSize: fontSize.xl, fontWeight: '800', letterSpacing: -0.3 },
  heading: { fontSize: fontSize.md, fontWeight: '700' },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: { fontSize: fontSize.md },
  caption: { fontSize: fontSize.sm, color: colors.textMuted },
});
