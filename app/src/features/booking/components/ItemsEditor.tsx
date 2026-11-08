import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { Button, Text } from '@/shared/ui';

import type { BookingItemFormValues } from '../types';

const MAX_ITEMS = 20;

export const EMPTY_ITEM: BookingItemFormValues = { name: '', quantity: '1', note: '' };

type RowErrors = Partial<Record<keyof BookingItemFormValues, string>>;

interface ItemsEditorProps {
  items: BookingItemFormValues[];
  onChange: (items: BookingItemFormValues[]) => void;
  /** Error per row index, keyed by field. */
  errors?: Record<number, RowErrors>;
  listError?: string;
  editable?: boolean;
  /** Store orders: the list may be empty, and the last row can be removed. */
  allowEmpty?: boolean;
  title?: string;
  itemPlaceholder?: string;
  notePlaceholder?: string;
}

/**
 * The Pabili shopping list as a table: one row per item with its quantity and
 * an optional note, the way a list is written on paper. Each row's first
 * error shows directly under that row.
 */
export function ItemsEditor({
  items,
  onChange,
  errors,
  listError,
  editable = true,
  allowEmpty = false,
  title = 'Shopping list',
  itemPlaceholder = 'e.g. Bottled water 1L',
  notePlaceholder = 'Brand, size',
}: ItemsEditorProps) {
  const canRemoveRows = editable && (items.length > 1 || allowEmpty);

  const updateItem = (index: number, patch: Partial<BookingItemFormValues>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <View style={styles.group}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]} accessibilityRole="header">
          <Text style={[styles.headerText, styles.nameColumn]}>ITEM</Text>
          <Text style={[styles.headerText, styles.quantityColumn]}>QTY</Text>
          <Text style={[styles.headerText, styles.noteColumn]}>NOTE</Text>
          {editable && <View style={styles.removeColumn} />}
        </View>
        {items.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text variant="caption">No items yet.</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <ItemRow
              key={index}
              rowNumber={index + 1}
              item={item}
              errors={errors?.[index]}
              editable={editable}
              itemPlaceholder={itemPlaceholder}
              notePlaceholder={notePlaceholder}
              onChange={(patch) => updateItem(index, patch)}
              onRemove={canRemoveRows ? () => removeItem(index) : undefined}
            />
          ))
        )}
      </View>
      {listError !== undefined && (
        <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
          {listError}
        </Text>
      )}
      {editable && items.length < MAX_ITEMS && (
        <Button
          variant="secondary"
          label={items.length === 0 ? 'Add an item' : 'Add another item'}
          onPress={() => onChange([...items, EMPTY_ITEM])}
        />
      )}
    </View>
  );
}

interface ItemRowProps {
  rowNumber: number;
  item: BookingItemFormValues;
  errors?: RowErrors;
  editable: boolean;
  itemPlaceholder: string;
  notePlaceholder: string;
  onChange: (patch: Partial<BookingItemFormValues>) => void;
  /** Absent when this row may not be removed (last row of a required list, or read-only). */
  onRemove?: () => void;
}

function ItemRow({
  rowNumber,
  item,
  errors,
  editable,
  itemPlaceholder,
  notePlaceholder,
  onChange,
  onRemove,
}: ItemRowProps) {
  const firstError = errors?.name ?? errors?.quantity ?? errors?.note;

  return (
    <View style={styles.bodyRow} accessibilityLabel={`Item ${rowNumber}`}>
      <View style={styles.row}>
        <CellInput
          style={styles.nameColumn}
          accessibilityLabel={`Item ${rowNumber} name`}
          placeholder={itemPlaceholder}
          value={item.name}
          onChangeText={(name) => onChange({ name })}
          hasError={errors?.name !== undefined}
          editable={editable}
        />
        <CellInput
          style={styles.quantityColumn}
          accessibilityLabel={`Item ${rowNumber} quantity`}
          keyboardType="number-pad"
          textAlign="center"
          value={item.quantity}
          onChangeText={(quantity) => onChange({ quantity })}
          hasError={errors?.quantity !== undefined}
          editable={editable}
        />
        <CellInput
          style={styles.noteColumn}
          accessibilityLabel={`Item ${rowNumber} note`}
          placeholder={notePlaceholder}
          value={item.note}
          onChangeText={(note) => onChange({ note })}
          hasError={errors?.note !== undefined}
          editable={editable}
        />
        {editable && (
          <View style={styles.removeColumn}>
            {onRemove !== undefined && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove item ${rowNumber}`}
                onPress={onRemove}
                hitSlop={8}
                style={styles.removeButton}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        )}
      </View>
      {firstError !== undefined && (
        <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
          {firstError}
        </Text>
      )}
    </View>
  );
}

interface CellInputProps extends Omit<TextInputProps, 'style'> {
  style: StyleProp<ViewStyle>;
  hasError: boolean;
}

/** A compact, label-less input for a table cell; the row carries the error text. */
function CellInput({ style, hasError, editable, ...props }: CellInputProps) {
  return (
    <TextInput
      accessibilityState={{ disabled: editable === false }}
      placeholderTextColor={colors.textMuted}
      editable={editable}
      style={[styles.cell, style, hasError && styles.cellError]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  title: { fontWeight: '600' },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerRow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.6 },
  bodyRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emptyRow: { padding: spacing.md },
  // minWidth 0 lets the cells shrink below a web input's intrinsic width on narrow phones.
  nameColumn: { flex: 2, minWidth: 0 },
  quantityColumn: { width: 56 },
  noteColumn: { flex: 1.5, minWidth: 0 },
  removeColumn: { width: 32, alignItems: 'center', justifyContent: 'center' },
  removeButton: { padding: spacing.xs, borderRadius: radius.pill },
  cell: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontSize: fontSize.md,
    color: colors.text,
  },
  cellError: { borderColor: colors.danger },
  error: { color: colors.danger },
});
