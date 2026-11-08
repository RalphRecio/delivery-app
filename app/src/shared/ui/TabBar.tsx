import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, spacing } from '@/config/theme';

import { Text } from './Text';

export interface TabBarItem {
  label: string;
  href: Href & string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

interface TabBarProps<Tab extends TabBarItem> {
  tabs: readonly Tab[];
  isActive: (tab: Tab) => boolean;
}

/**
 * Phone bottom navigation shared by the customer and rider apps. Imported
 * from its own path (not the ui index) because it depends on expo-router.
 */
export function TabBar<Tab extends TabBarItem>({ tabs, isActive }: TabBarProps<Tab>) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const active = isActive(tab);
        const color = active ? colors.primary : colors.textMuted;

        return (
          <Pressable
            key={tab.href}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => router.navigate(tab.href)}
            style={styles.tab}
          >
            <Ionicons name={active ? tab.activeIcon : tab.icon} size={24} color={color} />
            <Text style={[styles.label, { color }, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 2,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: fontSize.sm - 2, fontWeight: '600', letterSpacing: 0.2 },
  labelActive: { fontWeight: '800' },
});
