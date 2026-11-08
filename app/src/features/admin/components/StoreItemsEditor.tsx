import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { adminColors } from '@/config/adminTheme';
import { spacing } from '@/config/theme';
import { flattenIssues, type FieldErrors } from '@/features/auth';
import type { ApiError } from '@/shared/lib/api';
import { Alert, Input, Text } from '@/shared/ui';

import { useAddStoreProduct, useUpdateStoreProduct } from '../hooks/useAdminQueries';
import { storeProductFormSchema } from '../schemas/adminSchemas';
import type { AdminStoreProduct, StoreProductFormValues, StoreProductInput } from '../types';
import { AdminButton, Panel, StatusPill } from '../ui';

const EMPTY_ITEM: StoreProductFormValues = {
  name: '',
  description: '',
  price: '',
  is_available: true,
};

/**
 * The store's menu: add items, fix a name or price, and mark items sold out.
 * Sold-out items stay listed here but customers do not see them.
 */
export function StoreItemsEditor({
  storeId,
  products,
}: {
  storeId: number;
  products: AdminStoreProduct[];
}) {
  const add = useAddStoreProduct(storeId);
  const update = useUpdateStoreProduct(storeId);
  const [editingId, setEditingId] = useState<number | null>(null);
  const available = products.filter((product) => product.is_available).length;

  const toInput = (product: AdminStoreProduct, isAvailable: boolean): StoreProductInput => ({
    name: product.name,
    description: product.description,
    price: (product.price.centavos / 100).toFixed(2),
    is_available: isAvailable,
  });

  return (
    <View style={styles.stack}>
      <Text variant="caption">
        {products.length === 0
          ? 'No items yet. Customers see this store with an empty menu until you add some.'
          : `${available} of ${products.length} items available to customers.`}
      </Text>

      {products.map((product) =>
        editingId === product.id ? (
          <Panel key={product.id}>
            <ItemForm
              initial={{
                name: product.name,
                description: product.description ?? '',
                price: (product.price.centavos / 100).toFixed(2),
                is_available: product.is_available,
              }}
              submitLabel="Save item"
              isSubmitting={update.isPending}
              error={update.error}
              onSubmit={(input) =>
                update.mutate(
                  { productId: product.id, input },
                  { onSuccess: () => setEditingId(null) },
                )
              }
              onCancel={() => setEditingId(null)}
            />
          </Panel>
        ) : (
          <View key={product.id} style={styles.row} accessibilityLabel={`Item ${product.name}`}>
            <View style={styles.flex}>
              <Text style={styles.name}>{product.name}</Text>
              {product.description !== null && <Text variant="caption">{product.description}</Text>}
              <Text style={styles.price}>{product.price.formatted}</Text>
            </View>
            {!product.is_available && <StatusPill label="Sold out" tone="red" />}
            <Switch
              accessibilityLabel={`${product.name} available`}
              value={product.is_available}
              onValueChange={(isAvailable) =>
                update.mutate({ productId: product.id, input: toInput(product, isAvailable) })
              }
              disabled={update.isPending}
              trackColor={{ true: adminColors.brand }}
            />
            <AdminButton variant="ghost" label="Edit" onPress={() => setEditingId(product.id)} />
          </View>
        ),
      )}

      {update.isError && editingId === null && (
        <Alert tone="error" message={update.error.message} />
      )}

      <Panel>
        <Text style={styles.name}>Add an item</Text>
        <ItemForm
          initial={EMPTY_ITEM}
          submitLabel="Add item"
          isSubmitting={add.isPending}
          error={add.error}
          onSubmit={(input, reset) => add.mutate(input, { onSuccess: reset })}
        />
      </Panel>
    </View>
  );
}

interface ItemFormProps {
  initial: StoreProductFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  error: ApiError | null;
  onSubmit: (input: StoreProductInput, reset: () => void) => void;
  onCancel?: () => void;
}

function ItemForm({
  initial,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const [values, setValues] = useState<StoreProductFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  const edit = (field: 'name' | 'description' | 'price', text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors({});
  };

  const submit = () => {
    const result = storeProductFormSchema.safeParse(values);

    if (!result.success) {
      setErrors(flattenIssues(result.error));

      return;
    }

    onSubmit(result.data, () => setValues(initial));
  };

  const fieldError = (field: string) => errors[field] ?? error?.fieldError(field);

  return (
    <View style={styles.stack}>
      <View style={styles.formRow}>
        <View style={styles.nameField}>
          <Input
            size="compact"
            label="Item name"
            placeholder="e.g. Rice, 1 kg"
            value={values.name}
            onChangeText={(text) => edit('name', text)}
            error={fieldError('name')}
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.priceField}>
          <Input
            size="compact"
            label="Price (₱)"
            placeholder="58.50"
            keyboardType="decimal-pad"
            value={values.price}
            onChangeText={(text) => edit('price', text)}
            error={fieldError('price')}
            editable={!isSubmitting}
          />
        </View>
      </View>
      <Input
        size="compact"
        label="Description (optional)"
        placeholder="Size, flavour, brand"
        value={values.description}
        onChangeText={(text) => edit('description', text)}
        error={fieldError('description')}
        editable={!isSubmitting}
      />
      <View style={styles.actions}>
        {onCancel !== undefined && (
          <AdminButton
            variant="outline"
            label="Cancel"
            onPress={onCancel}
            disabled={isSubmitting}
          />
        )}
        <AdminButton size="lg" label={submitLabel} onPress={submit} isLoading={isSubmitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  flex: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
  price: { color: adminColors.text, fontWeight: '600' },
  formRow: { flexDirection: 'row', gap: spacing.sm },
  nameField: { flex: 2 },
  priceField: { flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
