import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize, adminRadius, adminShadow } from '@/config/adminTheme';
import { Text } from '@/shared/ui';

interface StatTileProps {
  label: string;
  value: string | number;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Hex colour of the icon tile; the tile background is the same hue at 8 %. */
  accent: string;
  hint?: string;
}

/** A dashboard figure: small caps label, large value, tinted icon at top right. */
export function StatTile({ label, value, icon, accent, hint }: StatTileProps) {
  return (
    <View style={styles.tile} accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.top}>
        <View style={styles.text}>
          <Text style={styles.label} numberOfLines={1}>
            {label.toUpperCase()}
          </Text>
          <Text style={styles.value} numberOfLines={1}>
            {String(value)}
          </Text>
        </View>
        <View style={[styles.icon, { backgroundColor: `${accent}14` }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
      </View>
      {hint !== undefined && (
        <Text style={styles.hint} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 220,
    gap: 10,
    padding: 16,
    borderRadius: adminRadius.panel,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.surface,
    ...adminShadow.panel,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  text: { flex: 1, gap: 6 },
  label: {
    fontSize: adminFontSize.sm,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: adminColors.textMuted,
  },
  value: {
    fontSize: adminFontSize.stat,
    lineHeight: 34,
    fontWeight: '600',
    color: adminColors.text,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: adminFontSize.sm, color: adminColors.textMuted },
});
