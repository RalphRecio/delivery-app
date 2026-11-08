import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadow, spacing } from '@/config/theme';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { Text } from '@/shared/ui';

import { BrandMark } from './BrandMark';

interface AuthCardProps {
  /** One line under the brand mark saying what this page is for. */
  blurb: string;
}

/** Brand mark and blurb above the form: flat on phones, a white card on desktop. */
export function AuthCard({ blurb, children }: PropsWithChildren<AuthCardProps>) {
  const { isDesktop } = useBreakpoint();

  return (
    <>
      <View style={styles.brand}>
        <BrandMark />
        <Text variant="caption">{blurb}</Text>
      </View>
      <View style={[styles.card, isDesktop && styles.cardDesktop]}>{children}</View>
    </>
  );
}

interface AuthLinkProps {
  prompt: string;
  label: string;
  href: string;
  /** Replace instead of push, e.g. register → sign in, so back does not bounce between them. */
  replace?: boolean;
}

/** One-line "Prompt? Action" row under the card. */
export function AuthLink({ prompt, label, href, replace = false }: AuthLinkProps) {
  return (
    <View style={styles.link}>
      <Text variant="caption">{prompt}</Text>
      <Pressable
        accessibilityRole="link"
        hitSlop={8}
        onPress={() => (replace ? router.replace(href) : router.push(href))}
      >
        <Text style={styles.linkLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  cardDesktop: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  link: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  linkLabel: { fontWeight: '700', color: colors.primaryPressed },
});
