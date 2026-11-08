import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { adminColors, adminFontSize, adminRadius, adminShadow } from '@/config/adminTheme';
import { Text } from '@/shared/ui';

interface PanelProps extends ViewProps {
  title?: string;
  subtitle?: string;
  /** Right side of the header: counts, legends, buttons. */
  actions?: ReactNode;
  /** Removes the body padding, for a table that fills the panel. */
  isFlush?: boolean;
}

/** A bordered white section with an optional header rule, the console's building block. */
export function Panel({
  title,
  subtitle,
  actions,
  isFlush = false,
  style,
  children,
  ...props
}: PropsWithChildren<PanelProps>) {
  return (
    <View style={[styles.panel, style]} {...props}>
      {title !== undefined && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {actions !== undefined && <View style={styles.actions}>{actions}</View>}
        </View>
      )}
      <View style={isFlush ? undefined : styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.panel,
    overflow: 'hidden',
    ...adminShadow.panel,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: adminFontSize.base, fontWeight: '600', color: adminColors.text },
  subtitle: { fontSize: adminFontSize.sm, color: adminColors.textMuted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  body: { padding: 20, gap: 12 },
});
