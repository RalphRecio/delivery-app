import { StyleSheet, View } from 'react-native';

import { adminFontSize, adminRadius, pillColors, type PillTone } from '@/config/adminTheme';
import { Text } from '@/shared/ui';

interface StatusPillProps {
  label: string;
  tone?: PillTone;
}

/** Soft rectangular status chip, as in the requisition list. */
export function StatusPill({ label, tone = 'gray' }: StatusPillProps) {
  const palette = pillColors[tone];

  return (
    <View
      style={[styles.pill, { backgroundColor: palette.background, borderColor: palette.border }]}
    >
      <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.pill,
    borderWidth: 1,
  },
  label: { fontSize: adminFontSize.sm, fontWeight: '600' },
});
