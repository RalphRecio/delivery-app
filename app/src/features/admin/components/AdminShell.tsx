import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import type { ComponentProps, PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize } from '@/config/adminTheme';
import { APP_NAME } from '@/config/brand';
import { formatPhilippineMobile, useCurrentUser, useLogout } from '@/features/auth';
import { Logo, Text } from '@/shared/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  label: string;
  icon: IconName;
  href: '/admin' | '/admin/bookings' | '/admin/users' | '/admin/stores' | '/admin/tariffs';
  /** Also highlights child routes such as /admin/bookings/12. */
  prefix: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', icon: 'grid-outline', href: '/admin', prefix: '/admin' },
      {
        label: 'Bookings',
        icon: 'document-text-outline',
        href: '/admin/bookings',
        prefix: '/admin/bookings',
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        label: 'Riders & users',
        icon: 'people-outline',
        href: '/admin/users',
        prefix: '/admin/users',
      },
      {
        label: 'Stores',
        icon: 'storefront-outline',
        href: '/admin/stores',
        prefix: '/admin/stores',
      },
      {
        label: 'Tariffs',
        icon: 'pricetag-outline',
        href: '/admin/tariffs',
        prefix: '/admin/tariffs',
      },
    ],
  },
];

export const SIDEBAR_WIDTH = 256;
const HEADER_HEIGHT = 56;

/** Header-bar titles, matched longest prefix first. */
const TITLES: [string, string][] = [
  ['/admin/bookings/', 'Booking'],
  ['/admin/bookings', 'Bookings'],
  ['/admin/users', 'Riders & users'],
  ['/admin/stores/new', 'Add a store'],
  ['/admin/stores/', 'Store'],
  ['/admin/stores', 'Stores'],
  ['/admin/tariffs', 'Tariffs'],
  ['/admin', 'Dashboard'],
];

/**
 * Desktop frame of the admin console, after the Suhay ERP layout: a white
 * sidebar with grouped navigation and the signed-in admin at the bottom, a
 * 56 px header bar naming the current page, and the routed page on a grey
 * canvas. The sidebar's brand row and the header share one height so their
 * bottom rules form a single line.
 */
export function AdminShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const me = useCurrentUser();
  const logout = useLogout();
  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'Admin';

  const isActive = (item: NavItem) =>
    item.prefix === '/admin' ? pathname === '/admin' : pathname.startsWith(item.prefix);

  return (
    <View style={styles.frame}>
      <View style={styles.sidebar} accessibilityRole="menu" accessibilityLabel="Admin navigation">
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/admin')}
          style={({ pressed }) => [styles.brand, pressed && styles.rowPressed]}
        >
          <Logo size={32} />
          <View style={styles.brandText}>
            <Text style={styles.brandName} numberOfLines={1}>
              {APP_NAME}
            </Text>
            <Text style={styles.brandSub}>Admin console</Text>
          </View>
        </Pressable>

        <ScrollView style={styles.nav} contentContainerStyle={styles.navContent}>
          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
              {section.items.map((item) => {
                const active = isActive(item);

                return (
                  <View key={item.href} style={styles.navRowFrame}>
                    {active && <View style={styles.activeMarker} />}
                    <Pressable
                      accessibilityRole="link"
                      accessibilityState={{ selected: active }}
                      onPress={() => router.push(item.href)}
                      style={({ pressed }) => [
                        styles.navItem,
                        active && styles.navItemActive,
                        pressed && !active && styles.rowPressed,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={17}
                        color={active ? adminColors.navActiveIcon : adminColors.textFaint}
                      />
                      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={styles.account}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(me.data?.name)}</Text>
          </View>
          <View style={styles.accountText}>
            <Text style={styles.accountName} numberOfLines={1}>
              {me.data?.name ?? 'Admin'}
            </Text>
            <Text style={styles.accountMeta} numberOfLines={1}>
              {me.data !== undefined ? formatPhilippineMobile(me.data.phone) : 'Administrator'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            accessibilityState={{ busy: logout.isPending }}
            disabled={logout.isPending}
            onPress={() => logout.mutate()}
            hitSlop={6}
            style={({ pressed }) => [styles.iconButton, pressed && styles.rowPressed]}
          >
            <Ionicons name="log-out-outline" size={18} color={adminColors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.header}>
          <Ionicons name="albums-outline" size={18} color={adminColors.textMuted} />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

function initials(name: string | null | undefined): string {
  if (name === null || name === undefined || name.trim() === '') {
    return 'A';
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const styles = StyleSheet.create({
  frame: { flex: 1, flexDirection: 'row', backgroundColor: adminColors.canvas },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: adminColors.surface,
    borderRightWidth: 1,
    borderRightColor: adminColors.border,
  },
  brand: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  brandText: { flex: 1 },
  brandName: { fontSize: adminFontSize.base, fontWeight: '600', color: adminColors.text },
  brandSub: { fontSize: adminFontSize.xs, color: adminColors.textMuted },
  nav: { flex: 1 },
  navContent: { paddingVertical: 12, gap: 20 },
  section: { gap: 2 },
  sectionTitle: {
    fontSize: adminFontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.9,
    color: adminColors.textFaint,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  navRowFrame: { paddingHorizontal: 8 },
  activeMarker: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: adminColors.navActiveIcon,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  navItemActive: { backgroundColor: adminColors.navActiveBackground },
  rowPressed: { backgroundColor: adminColors.surfaceMuted },
  navLabel: { fontSize: adminFontSize.base, color: adminColors.textSecondary },
  navLabelActive: { color: adminColors.navActiveText, fontWeight: '500' },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: adminColors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: adminFontSize.sm, fontWeight: '600', color: adminColors.brand },
  accountText: { flex: 1 },
  accountName: { fontSize: adminFontSize.md, fontWeight: '500', color: adminColors.text },
  accountMeta: { fontSize: adminFontSize.xs, color: adminColors.textMuted },
  iconButton: { padding: 6, borderRadius: 6 },
  main: { flex: 1 },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    backgroundColor: adminColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  headerTitle: { fontSize: adminFontSize.base, fontWeight: '500', color: adminColors.text },
  content: { padding: 24, gap: 20, maxWidth: 1600, width: '100%' },
});
