import { Pressable, StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize, adminRadius } from '@/config/adminTheme';
import { spacing } from '@/config/theme';
import type { PaginationMeta } from '@/shared/types/api';

import { Text } from './Text';

interface PaginationProps {
  meta: PaginationMeta;
  itemName: string;
  onPageChange: (page: number) => void;
  perPage: number;
  perPageOptions?: number[];
  onPerPageChange: (perPage: number) => void;
}

/** "Showing 1–10 of 2415 bookings · Per page 10" with previous/next and nearby page numbers. */
export function Pagination({
  meta,
  itemName,
  onPageChange,
  perPage,
  perPageOptions = [10, 25, 50],
  onPerPageChange,
}: PaginationProps) {
  const pages = visiblePages(meta.current_page, meta.last_page);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text variant="caption">
          Showing{' '}
          <Text style={styles.strong}>
            {meta.from ?? 0}–{meta.to ?? 0}
          </Text>{' '}
          of <Text style={styles.strong}>{meta.total}</Text> {itemName}
        </Text>
        <Text variant="caption">Per page</Text>
        <View style={styles.pages}>
          {perPageOptions.map((option) => (
            <PageButton
              key={option}
              label={String(option)}
              isActive={option === perPage}
              onPress={() => onPerPageChange(option)}
            />
          ))}
        </View>
      </View>
      <View style={styles.pages}>
        <PageButton
          label="‹"
          onPress={() => onPageChange(meta.current_page - 1)}
          isDisabled={meta.current_page <= 1}
        />
        {pages.map((page, index) =>
          page === null ? (
            <Text key={`gap-${index}`} variant="caption" style={styles.gap}>
              …
            </Text>
          ) : (
            <PageButton
              key={page}
              label={String(page)}
              isActive={page === meta.current_page}
              onPress={() => onPageChange(page)}
            />
          ),
        )}
        <PageButton
          label="›"
          onPress={() => onPageChange(meta.current_page + 1)}
          isDisabled={meta.current_page >= meta.last_page}
        />
      </View>
    </View>
  );
}

function PageButton({
  label,
  onPress,
  isActive = false,
  isDisabled = false,
}: {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Page ${label}`}
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[styles.button, isActive && styles.buttonActive, isDisabled && styles.buttonDisabled]}
    >
      <Text style={[styles.buttonText, isActive && styles.buttonTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** First, last, and the pages around the current one; null marks a gap. */
function visiblePages(current: number, last: number): (number | null)[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages = new Set<number>(
    [1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];

    if (previous !== undefined && page - previous > 1) {
      result.push(null);
    }

    result.push(page);
  });

  return result;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  strong: { fontWeight: '600', color: adminColors.text },
  pages: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  gap: { paddingHorizontal: spacing.xs },
  button: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: adminRadius.control,
    borderWidth: 1,
    borderColor: adminColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.surface,
  },
  buttonActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: adminFontSize.sm, fontWeight: '500', color: adminColors.textSecondary },
  buttonTextActive: { color: '#FFFFFF' },
});
