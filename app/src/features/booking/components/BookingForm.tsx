import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { z } from 'zod';

import { spacing } from '@/config/theme';
import { LocationPicker } from '@/features/map';
import { OrderSummary } from '@/features/store';
import { formatMoney } from '@/shared/lib/format';
import {
  selectCartCount,
  selectCartSubtotalCentavos,
  useCartLines,
  useCartStore,
} from '@/stores/cartStore';
import type { ApiError } from '@/shared/lib/api';
import { Alert, Button, Card, Disclosure, Input, Text } from '@/shared/ui';

import { useCreateBooking, type CreateBookingVariables } from '../hooks/useCreateBooking';
import { useFareQuote } from '../hooks/useFareQuote';
import { pabiliFormCopy } from '../lib/offerings';
import { EMPTY_LOCATION, SAMPLE_DROPOFF, SAMPLE_PICKUP } from '../lib/sampleLocations';
import {
  pabiliFormSchema,
  pabiliStoreOrderFormSchema,
  pasuyoFormSchema,
} from '../schemas/bookingSchemas';
import type {
  Booking,
  BookingItemFormValues,
  LocationFormValues,
  PabiliCategory,
  ServiceType,
} from '../types';

import { FareSummary } from './FareSummary';
import { EMPTY_ITEM, ItemsEditor } from './ItemsEditor';

interface BookingFormProps {
  serviceType: ServiceType;
  /** Pabili only: what kind of shopping this is. Ignored for Pasuyo. */
  pabiliCategory?: PabiliCategory;
  onBooked: (booking: Booking) => void;
  /** `split`: locations on the left, details and fare on the right (desktop). */
  layout?: 'stacked' | 'split';
  /** Pabili without a store: the customer pins the store and types the list. */
  isManualPabili?: boolean;
  /** Store order: where "Change store" goes (the screen owns navigation). */
  onChangeStore?: () => void;
}

interface FormValues {
  pabili_category: PabiliCategory;
  pickup: LocationFormValues;
  dropoff: LocationFormValues;
  items: BookingItemFormValues[];
  purchase_budget: string;
  recipient_name: string;
  recipient_phone: string;
  parcel_description: string;
  notes: string;
}

/** Field path ("pickup.latitude", "items.0.name") → message. */
type FieldErrors = Record<string, string>;

const INITIAL_VALUES: FormValues = {
  pabili_category: 'grocery',
  pickup: EMPTY_LOCATION,
  dropoff: EMPTY_LOCATION,
  items: [EMPTY_ITEM],
  purchase_budget: '',
  recipient_name: '',
  recipient_phone: '',
  parcel_description: '',
  notes: '',
};

/**
 * Two steps on one screen: fill in the details, review the server's fare,
 * confirm. Editing anything after a quote discards it, so the fare shown is
 * always the fare for the current inputs.
 */
export function BookingForm({
  serviceType,
  pabiliCategory = 'grocery',
  onBooked,
  layout = 'stacked',
  isManualPabili = false,
  onChangeStore,
}: BookingFormProps) {
  const isSplit = layout === 'split';
  const cartStore = useCartStore((state) => state.store);
  const cartLines = useCartLines();
  const cartCount = useCartStore(selectCartCount);
  const cartSubtotal = useCartStore(selectCartSubtotalCentavos);
  const clearCart = useCartStore((state) => state.clear);
  // A store order: the cart has a store and the customer did not ask for the manual form.
  const isStoreOrder = serviceType === 'pabili' && !isManualPabili && cartStore !== null;
  const [values, setValues] = useState<FormValues>(() =>
    isStoreOrder
      ? {
          ...INITIAL_VALUES,
          pabili_category: pabiliCategory,
          items: [],
          purchase_budget: (cartSubtotal / 100).toFixed(2).replace(/\.00$/, ''),
        }
      : { ...INITIAL_VALUES, pabili_category: pabiliCategory },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const quote = useFareQuote();
  const create = useCreateBooking();

  const isPabili = serviceType === 'pabili';
  const pabiliCopy = pabiliFormCopy(pabiliCategory);
  // Only Pasuyo asks for a pickup: a store order takes the store's, and a
  // typed Pabili leaves the choice of store to the rider.
  const hasPickup = !isPabili;
  const isQuoted = quote.isSuccess;
  const isBusy = quote.isPending || create.isPending;

  const edit = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
    quote.reset();
    create.reset();
  };

  const parse = () => {
    const result = isStoreOrder
      ? pabiliStoreOrderFormSchema.safeParse(values)
      : isPabili
        ? pabiliFormSchema.safeParse(values)
        : pasuyoFormSchema.safeParse(values);

    if (!result.success) {
      setErrors(flattenIssues(result.error));

      return null;
    }

    return result.data;
  };

  const handleReview = () => {
    const input = parse();

    if (input === null) {
      return;
    }

    // Pasuyo: the customer's pickup. Store order: the store. Typed Pabili: none,
    // the rider chooses a store near the drop-off and the server quotes accordingly.
    const pickup =
      'pickup' in input ? input.pickup : isStoreOrder ? cartStore?.location : undefined;

    quote.mutate({
      service_type: serviceType,
      pickup:
        pickup === undefined || pickup === null
          ? undefined
          : { latitude: pickup.latitude, longitude: pickup.longitude },
      dropoff: { latitude: input.dropoff.latitude, longitude: input.dropoff.longitude },
    });
  };

  const handleConfirm = () => {
    const input = parse();

    if (input === null) {
      return;
    }

    const variables: CreateBookingVariables = isStoreOrder
      ? {
          service_type: 'pabili',
          input: {
            ...(input as z.output<typeof pabiliStoreOrderFormSchema>),
            store_id: cartStore.id,
            items: [
              ...cartLines.map((line) => ({
                product_id: line.product.id,
                quantity: line.quantity,
              })),
              ...(input as z.output<typeof pabiliStoreOrderFormSchema>).items,
            ],
          },
        }
      : isPabili
        ? { service_type: 'pabili', input: input as z.output<typeof pabiliFormSchema> }
        : { service_type: 'pasuyo', input: input as z.output<typeof pasuyoFormSchema> };

    if (
      isStoreOrder &&
      cartCount === 0 &&
      (input as z.output<typeof pabiliStoreOrderFormSchema>).items.length === 0
    ) {
      setErrors({ items: 'Add at least one product or item.' });

      return;
    }

    create.mutate(variables, {
      onSuccess: (booking) => {
        clearCart();
        onBooked(booking);
      },
    });
  };

  const requestError = describeError(quote.error ?? create.error);

  const locations = (
    <>
      <Button
        variant="secondary"
        label="Use sample locations"
        onPress={() => {
          setValues((current) =>
            hasPickup
              ? { ...current, pickup: SAMPLE_PICKUP, dropoff: SAMPLE_DROPOFF }
              : { ...current, dropoff: SAMPLE_DROPOFF },
          );
          setErrors({});
          quote.reset();
          create.reset();
        }}
        disabled={isBusy}
      />
      {isStoreOrder && <OrderSummary onChangeStore={() => onChangeStore?.()} editable={!isBusy} />}
      {hasPickup && (
        <LocationPicker
          title="Pickup"
          value={values.pickup}
          onChange={(pickup) => edit('pickup', pickup)}
          errors={pick(errors, 'pickup')}
          editable={!isBusy}
          detailsPlaceholder="Floor, unit, gate colour, who to call"
        />
      )}
      <LocationPicker
        title="Drop-off"
        value={values.dropoff}
        onChange={(dropoff) => edit('dropoff', dropoff)}
        errors={pick(errors, 'dropoff')}
        editable={!isBusy}
      />
    </>
  );

  const details = (
    <>
      {isPabili ? (
        <>
          {isStoreOrder && (
            <Text variant="caption">
              Need something that is not on the menu? Add it below and the rider will look for it.
            </Text>
          )}
          <ItemsEditor
            items={values.items}
            onChange={(items) => edit('items', items)}
            errors={itemErrors(errors)}
            listError={errors.items}
            editable={!isBusy}
            allowEmpty={isStoreOrder}
            title={isStoreOrder ? 'Anything else from this store?' : pabiliCopy.listTitle}
            itemPlaceholder={pabiliCopy.itemPlaceholder}
            notePlaceholder={pabiliCopy.notePlaceholder}
          />
          <Input
            label="Purchase budget (₱)"
            placeholder="500"
            keyboardType="decimal-pad"
            value={values.purchase_budget}
            onChangeText={(text) => edit('purchase_budget', text)}
            error={errors.purchase_budget}
            hint={
              isStoreOrder
                ? `At least the items subtotal of ${formatMoney(cartSubtotal)}; add room for extras. Reimbursed in cash on delivery.`
                : pabiliCopy.budgetHint
            }
            editable={!isBusy}
          />
        </>
      ) : (
        <>
          <Input
            label="Recipient name"
            value={values.recipient_name}
            onChangeText={(text) => edit('recipient_name', text)}
            error={errors.recipient_name}
            editable={!isBusy}
          />
          <Input
            label="Recipient mobile number"
            placeholder="0917 123 4567"
            keyboardType="phone-pad"
            value={values.recipient_phone}
            onChangeText={(text) => edit('recipient_phone', text)}
            error={errors.recipient_phone}
            editable={!isBusy}
          />
          <Input
            label="What is being sent?"
            placeholder="e.g. Documents in an envelope"
            value={values.parcel_description}
            onChangeText={(text) => edit('parcel_description', text)}
            error={errors.parcel_description}
            editable={!isBusy}
          />
        </>
      )}

      <Disclosure
        title="Other details"
        hint="Optional: anything else the rider should know."
        isForcedOpen={errors.notes !== undefined}
      >
        <Input
          label="Notes for the rider"
          placeholder={
            isPabili ? pabiliCopy.riderNotesPlaceholder : 'Gate code, landmarks, who to call'
          }
          multiline
          value={values.notes}
          onChangeText={(text) => edit('notes', text)}
          error={errors.notes}
          editable={!isBusy}
        />
      </Disclosure>

      {requestError !== undefined && <Alert tone="error" message={requestError} />}

      {isQuoted ? (
        <>
          <Text style={styles.sectionTitle}>Your fare</Text>
          <FareSummary fare={quote.data.fare} />
          <Button label="Confirm booking" onPress={handleConfirm} isLoading={create.isPending} />
          <Text variant="caption">Change any detail above to get a new quote.</Text>
        </>
      ) : (
        <Button label="Review fare" onPress={handleReview} isLoading={quote.isPending} />
      )}
    </>
  );

  if (isSplit) {
    return (
      <View style={styles.split}>
        <View style={styles.splitColumn}>{locations}</View>
        <Card style={styles.splitColumn}>
          <Text style={styles.sectionTitle}>
            {isStoreOrder ? 'Your order' : isPabili ? 'What to buy' : 'What to send'}
          </Text>
          {details}
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      {locations}
      {details}
    </View>
  );
}

function flattenIssues(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');

    if (!(path in errors)) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

function pick(
  errors: FieldErrors,
  prefix: 'pickup' | 'dropoff',
): Partial<Record<keyof LocationFormValues, string>> {
  return {
    address: errors[`${prefix}.address`],
    landmark: errors[`${prefix}.landmark`],
    details: errors[`${prefix}.details`],
    point: errors[`${prefix}.point`],
  };
}

function itemErrors(
  errors: FieldErrors,
): Record<number, Partial<Record<keyof BookingItemFormValues, string>>> {
  const result: Record<number, Partial<Record<keyof BookingItemFormValues, string>>> = {};

  for (const [path, message] of Object.entries(errors)) {
    const match = /^items\.(\d+)\.(name|quantity|note)$/.exec(path);

    if (match !== null) {
      const index = Number(match[1]);
      const field = match[2] as keyof BookingItemFormValues;
      result[index] = { ...result[index], [field]: message };
    }
  }

  return result;
}

/** Surface the first field error from the server, otherwise the message. */
function describeError(error: ApiError | null): string | undefined {
  if (error === null) {
    return undefined;
  }

  const firstField = Object.values(error.errors)[0]?.[0];

  return firstField ?? error.message;
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  split: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  splitColumn: { flex: 1, gap: spacing.md },
  sectionTitle: { fontWeight: '700' },
});
