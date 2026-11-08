import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize, adminRadius } from '@/config/adminTheme';

import { Text } from './Text';

export interface DataTableColumn<TRow> {
  key: string;
  title: string;
  /** Flex weight; defaults to 1. */
  flex?: number;
  render: (row: TRow) => ReactNode;
}

interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  keyOf: (row: TRow) => string;
  onRowPress?: (row: TRow) => void;
  rowLabel?: (row: TRow) => string;
  emptyText: string;
  /** Rendered under the rows: pagination, totals. */
  footer?: ReactNode;
  /** Drops the outer border when the table sits inside a Panel. */
  isEmbedded?: boolean;
  /** Below this width the table scrolls sideways instead of squeezing its columns. */
  minWidth?: number;
}

/**
 * Desktop list in the console's style: small caps header, 52 px rows with
 * hairline dividers, horizontally scrollable when narrow.
 */
export function DataTable<TRow>({
  columns,
  rows,
  keyOf,
  onRowPress,
  rowLabel,
  emptyText,
  footer,
  isEmbedded = false,
  minWidth = 960,
}: DataTableProps<TRow>) {
  return (
    <View style={[styles.frame, isEmbedded && styles.frameEmbedded]}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scroll}
        showsHorizontalScrollIndicator={false}
      >
        <View style={[styles.table, { minWidth }]}>
          <View style={[styles.row, styles.headerRow]} accessibilityRole="header">
            {columns.map((column) => (
              <View key={column.key} style={[styles.cell, { flex: column.flex ?? 1 }]}>
                <Text style={styles.headerText}>{column.title.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          {rows.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          ) : (
            rows.map((row) => (
              <Pressable
                key={keyOf(row)}
                accessibilityRole={onRowPress === undefined ? undefined : 'button'}
                accessibilityLabel={rowLabel?.(row)}
                onPress={onRowPress === undefined ? undefined : () => onRowPress(row)}
                style={({ pressed }) => [styles.row, styles.bodyRow, pressed && styles.pressed]}
              >
                {columns.map((column) => (
                  <View key={column.key} style={[styles.cell, { flex: column.flex ?? 1 }]}>
                    {column.render(row)}
                  </View>
                ))}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
      {footer !== undefined && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.panel,
    backgroundColor: adminColors.surface,
    overflow: 'hidden',
  },
  frameEmbedded: { borderWidth: 0, borderRadius: 0 },
  scroll: { minWidth: '100%' },
  table: { flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    backgroundColor: adminColors.surface,
    minHeight: 40,
  },
  headerText: {
    fontSize: adminFontSize.xs,
    fontWeight: '600',
    color: adminColors.textMuted,
    letterSpacing: 0.6,
  },
  bodyRow: { borderBottomWidth: 1, borderBottomColor: adminColors.border, minHeight: 52 },
  pressed: { backgroundColor: adminColors.surfaceMuted },
  cell: { paddingHorizontal: 8, paddingVertical: 8, gap: 2 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: adminFontSize.base, color: adminColors.textMuted },
  footer: { paddingHorizontal: 16, paddingVertical: 10 },
});

export const dataTableText = StyleSheet.create({
  primary: { fontSize: adminFontSize.base, fontWeight: '500', color: adminColors.text },
  strong: { fontSize: adminFontSize.base, fontWeight: '700', color: adminColors.text },
  secondary: { fontSize: adminFontSize.sm, color: adminColors.textMuted },
});
