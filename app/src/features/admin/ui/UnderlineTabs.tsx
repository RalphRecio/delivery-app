import { Pressable, StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize } from '@/config/adminTheme';
import { Text } from '@/shared/ui';

export interface UnderlineTab<TValue extends string> {
  value: TValue | undefined;
  label: string;
  /** Shown as a small count beside the label when above zero. */
  count?: number;
}

interface UnderlineTabsProps<TValue extends string> {
  tabs: UnderlineTab<TValue>[];
  selected: TValue | undefined;
  onSelect: (value: TValue | undefined) => void;
}

/** The tab strip of a list page: small labels, blue underline on the active one. */
export function UnderlineTabs<TValue extends string>({
  tabs,
  selected,
  onSelect,
}: UnderlineTabsProps<TValue>) {
  return (
    <View style={styles.strip} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = tab.value === selected;

        return (
          <Pressable
            key={tab.value ?? 'all'}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect(tab.value)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={styles.count}>
                <Text style={styles.countText}>{tab.count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
    marginBottom: -1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: adminColors.navActiveIcon },
  label: { fontSize: adminFontSize.md, fontWeight: '500', color: adminColors.textMuted },
  labelActive: { color: adminColors.navActiveText },
  count: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: adminColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
});
