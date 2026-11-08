import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { APP_NAME } from '@/config/brand';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import { useCurrentUser, useLogout } from '@/features/auth';
import { Button, Text } from '@/shared/ui';

import { CUSTOMER_TABS, isTabActive } from '../lib/tabs';

export const CONTENT_MAX_WIDTH = 1120;

/**
 * Desktop frame for customers: a top bar with the brand, the service links
 * and the account, then a centred content column. Phones use the stacked
 * screens.
 */
export function CustomerShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const me = useCurrentUser();
  const logout = useLogout();

  return (
    <View style={styles.frame}>
      <View style={styles.bar}>
        <View style={styles.barInner}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/customer')}
            style={styles.brand}
          >
            <View style={styles.logo}>
              <Ionicons name="bicycle" size={20} color={colors.onPrimary} />
            </View>
            <Text style={styles.brandName}>{APP_NAME}</Text>
          </Pressable>
          <View style={styles.links}>
            {CUSTOMER_TABS.map((tab) => {
              const active = isTabActive(tab, pathname);

              return (
                <Pressable
                  key={tab.href}
                  accessibilityRole="link"
                  accessibilityState={{ selected: active }}
                  onPress={() => router.navigate(tab.href)}
                  style={[styles.link, active && styles.linkActive]}
                >
                  <Ionicons
                    name={active ? tab.activeIcon : tab.icon}
                    size={18}
                    color={active ? colors.primaryPressed : colors.textMuted}
                  />
                  <Text style={[styles.linkLabel, active && styles.linkLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.account}>
            <Text variant="caption" numberOfLines={1}>
              {me.data?.name ?? 'Customer'}
            </Text>
            <Button
              variant="ghost"
              label="Sign out"
              onPress={() => logout.mutate()}
              isLoading={logout.isPending}
            />
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: colors.surface },
  bar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  barInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    height: 64,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontWeight: '700', fontSize: fontSize.md },
  links: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  linkActive: { backgroundColor: colors.primarySoft },
  linkLabel: { color: colors.textMuted, fontWeight: '600' },
  linkLabelActive: { color: colors.primaryPressed },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, maxWidth: 260 },
  content: { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, alignItems: 'center' },
  column: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, gap: spacing.lg },
});
