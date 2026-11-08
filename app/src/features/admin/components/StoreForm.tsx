import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { adminColors } from '@/config/adminTheme';
import { spacing } from '@/config/theme';
import { flattenIssues, type FieldErrors } from '@/features/auth';
import { EMPTY_PICKED_LOCATION, LocationPicker, type PickedLocation } from '@/features/map';
import type { StoreCategory } from '@/features/store';
import type { ApiError } from '@/shared/lib/api';
import { Alert, FilterChips, Input, Text } from '@/shared/ui';

import { STORE_CATEGORY_OPTIONS } from '../lib/storeCategories';
import { storeFormSchema } from '../schemas/adminSchemas';
import type { AdminStore, StoreInput } from '../types';
import { AdminButton } from '../ui';

interface StoreFormProps {
  /** Absent when adding a new store. */
  store?: AdminStore;
  onSubmit: (input: StoreInput) => void;
  isSubmitting: boolean;
  error?: ApiError | null;
  submitLabel: string;
  /** Shown after a successful save, until the next edit. */
  savedMessage?: string;
}

interface Values {
  name: string;
  category: StoreCategory;
  location: PickedLocation;
  is_active: boolean;
}

function initialValues(store: AdminStore | undefined): Values {
  if (store === undefined) {
    return { name: '', category: 'grocery', location: EMPTY_PICKED_LOCATION, is_active: true };
  }

  return {
    name: store.name,
    category: store.category,
    location: {
      address: store.address,
      landmark: store.landmark ?? '',
      details: '',
      point: store.location,
    },
    is_active: store.is_active,
  };
}

/**
 * Name, kind of store and where it is. The pin matters most: it becomes the
 * pickup of every order from this store and decides which riders see it.
 */
export function StoreForm({
  store,
  onSubmit,
  isSubmitting,
  error,
  submitLabel,
  savedMessage,
}: StoreFormProps) {
  const [values, setValues] = useState<Values>(() => initialValues(store));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const edit = <K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
    setIsDirty(true);
  };

  const submit = () => {
    const result = storeFormSchema.safeParse({
      name: values.name,
      category: values.category,
      address: values.location.address,
      landmark: values.location.landmark,
      point: values.location.point,
      is_active: values.is_active,
    });

    if (!result.success) {
      setErrors(flattenIssues(result.error));

      return;
    }

    setIsDirty(false);
    onSubmit(result.data);
  };

  const fieldError = (field: string) => errors[field] ?? error?.fieldError(field);
  const hasFieldError = ['name', 'category', 'address', 'landmark', 'latitude', 'longitude'].some(
    (field) => error?.fieldError(field) !== undefined,
  );

  return (
    <View style={styles.form}>
      <Input
        size="compact"
        label="Store name"
        placeholder="e.g. Parang Public Market, Stall 12"
        value={values.name}
        onChangeText={(text) => edit('name', text)}
        error={fieldError('name')}
        editable={!isSubmitting}
      />
      <View style={styles.group}>
        <Text style={styles.label}>Kind of store</Text>
        <FilterChips
          variant="console"
          options={STORE_CATEGORY_OPTIONS}
          selected={values.category}
          onSelect={(category) => category !== undefined && edit('category', category)}
          wrap
        />
        <Text variant="caption">
          Decides which Pabili lists it: restaurants and bakeries under Pabili Food, the rest under
          Pabili and Pabili Pet Food.
        </Text>
      </View>
      <LocationPicker
        title="Store location"
        value={values.location}
        onChange={(location) => edit('location', location)}
        errors={{
          address: fieldError('address'),
          landmark: fieldError('landmark'),
          point: fieldError('point') ?? fieldError('latitude'),
        }}
        editable={!isSubmitting}
        hasDetails={false}
      />
      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.label}>Open for orders</Text>
          <Text variant="caption">
            {values.is_active
              ? 'Customers can find this store and order from it.'
              : 'Hidden from customers. Existing orders are not affected.'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Open for orders"
          value={values.is_active}
          onValueChange={(isActive) => edit('is_active', isActive)}
          disabled={isSubmitting}
          trackColor={{ true: adminColors.brand }}
        />
      </View>
      {error !== undefined && error !== null && !hasFieldError && (
        <Alert tone="error" message={error.message} />
      )}
      {savedMessage !== undefined && !isDirty && <Alert message={savedMessage} />}
      <AdminButton size="lg" label={submitLabel} onPress={submit} isLoading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  group: { gap: spacing.xs },
  label: { fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
});
