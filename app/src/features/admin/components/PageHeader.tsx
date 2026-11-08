import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize } from '@/config/adminTheme';
import { Text } from '@/shared/ui';

interface PageHeaderProps {
  title: string;
  /** One line under the title: what the page is for, or the record's key facts. */
  subtitle?: string;
  /** Where this page was opened from, shown as a link above the title. */
  back?: { href: Href; label: string };
  /** Sits beside the title, e.g. a status pill. */
  badge?: ReactNode;
  /** Right-aligned controls, e.g. an "Add" button. */
  actions?: ReactNode;
}

/** Heading block of a console page: title and description left, actions right. */
export function PageHeader({ title, subtitle, back, badge, actions }: PageHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {back !== undefined && (
          <Pressable
            accessibilityRole="link"
            onPress={() => (router.canGoBack() ? router.back() : router.replace(back.href))}
            hitSlop={6}
            style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
          >
            <Ionicons name="arrow-back" size={14} color={adminColors.textMuted} />
            <Text style={styles.backLabel}>{back.label}</Text>
          </Pressable>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge}
        </View>
        {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actions !== undefined && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  text: { gap: 2, flexShrink: 1 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  backPressed: { opacity: 0.6 },
  backLabel: { fontSize: adminFontSize.sm, fontWeight: '500', color: adminColors.textMuted },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  title: { fontSize: adminFontSize.xl, fontWeight: '600', color: adminColors.text },
  subtitle: { fontSize: adminFontSize.base, color: adminColors.textMuted },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
});
