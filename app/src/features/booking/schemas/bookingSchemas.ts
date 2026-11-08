import { z } from 'zod';

import { normalizePhilippineMobile } from '@/features/auth';

/* API responses */

export const moneySchema = z.object({
  centavos: z.number().int(),
  currency: z.literal('PHP'),
  formatted: z.string(),
});

export const geoPointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const serviceTypeSchema = z.enum(['pabili', 'pasuyo']);

/** Pabili only: pharmacy/grocery, food takeout, or pet food. */
export const pabiliCategorySchema = z.enum(['grocery', 'food', 'pet_food']);

export const bookingStatusSchema = z.enum([
  'pending',
  'searching',
  'accepted',
  'picking_up',
  'in_transit',
  'completed',
  'cancelled',
]);

export const fareBreakdownSchema = z.object({
  distance_meters: z.number().int(),
  base_fare: moneySchema,
  distance_fare: moneySchema,
  service_fee: moneySchema,
  total: moneySchema,
});

export const fareQuoteSchema = z.object({
  service_type: serviceTypeSchema,
  fare: fareBreakdownSchema,
});

export const bookingItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int(),
  note: z.string().nullable(),
  product_id: z.number().int().nullable().optional(),
  unit_price_centavos: z.number().int().nullable().optional(),
});

export const bookingStoreSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  category_label: z.string(),
  address: z.string(),
  landmark: z.string().nullable(),
});

export const bookingLocationSchema = z.object({
  address: z.string(),
  landmark: z.string().nullable(),
  details: z.string().nullable(),
  point: geoPointSchema,
});

export const contactSchema = z.object({
  id: z.number().int(),
  name: z.string().nullable(),
  phone: z.string(),
});

export const bookingStatusLogSchema = z.object({
  from_status: bookingStatusSchema.nullable(),
  to_status: bookingStatusSchema,
  to_status_label: z.string(),
  reason: z.string().nullable(),
  created_at: z.string(),
});

export const bookingSchema = z.object({
  id: z.number().int(),
  reference: z.string(),
  service_type: serviceTypeSchema,
  /** "Pabili · Food takeout", "Pasuyo": the server's one-line name for the booking. */
  service_label: z.string(),
  pabili_category: pabiliCategorySchema.nullable(),
  pabili_category_label: z.string().nullable(),
  status: bookingStatusSchema,
  status_label: z.string(),
  can_cancel: z.boolean(),
  payment_method: z.literal('cash'),
  pickup: bookingLocationSchema,
  dropoff: bookingLocationSchema,
  fare: fareBreakdownSchema,
  notes: z.string().nullable(),
  items: z.array(bookingItemSchema).nullable(),
  items_subtotal: moneySchema.nullable().optional(),
  purchase_budget: moneySchema.nullable(),
  store: bookingStoreSchema.nullable().optional(),
  recipient_name: z.string().nullable(),
  recipient_phone: z.string().nullable(),
  parcel_description: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  created_at: z.string(),
  search_radius_meters: z.number().int().nullable(),
  // Riders see this on the available-jobs list only.
  distance_to_pickup_meters: z.number().int().optional(),
  // The other party, when the endpoint loads it: rider for customers, customer for riders.
  customer: contactSchema.optional(),
  rider: contactSchema.nullable().optional(),
  // The rider's last reported position: only on the customer's own booking, only while the job is active.
  rider_location: z
    .object({ latitude: z.number(), longitude: z.number(), updated_at: z.string() })
    .nullable()
    .optional(),
  // Only present on show/create/cancel, not in the list.
  status_logs: z.array(bookingStatusLogSchema).optional(),
});

export const TERMINAL_STATUSES: readonly z.infer<typeof bookingStatusSchema>[] = [
  'completed',
  'cancelled',
];

/* Forms. Inputs are strings straight from text fields; the schema parses them. */

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value));

/**
 * The pin is required; the address is auto-filled from it but may be edited.
 * Output is flat (latitude/longitude at the top level), which is the API shape.
 */
export const locationFormSchema = z
  .object({
    address: z.string().trim().min(3, 'Enter the address.').max(255),
    landmark: optionalText(120, 'Keep the landmark under 120 characters.'),
    details: optionalText(255, 'Keep the details under 255 characters.'),
    point: z
      .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
      .nullable()
      .refine((point) => point !== null, 'Drop the pin on the map or use your location.'),
  })
  .transform(({ point, ...rest }) => ({
    ...rest,
    // The refine above guarantees a point; the non-null assertion is for the type only.
    latitude: point!.latitude,
    longitude: point!.longitude,
  }));

const notesField = z
  .string()
  .trim()
  .max(500, 'Keep notes under 500 characters.')
  .transform((value) => (value === '' ? null : value));

export const bookingItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Name the item.').max(120),
  quantity: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Quantity must be a whole number.')
    .transform(Number)
    .refine((value) => value >= 1 && value <= 99, 'Quantity must be 1 to 99.'),
  note: z
    .string()
    .trim()
    .max(200)
    .transform((value) => (value === '' ? null : value)),
});

/** Pabili from a store catalogue: the store is the pickup, custom items are optional extras. */
export const pabiliStoreOrderFormSchema = z.object({
  pabili_category: pabiliCategorySchema,
  dropoff: locationFormSchema,
  items: z.array(bookingItemFormSchema).max(20),
  purchase_budget: z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter a peso amount, e.g. 500 or 500.50.'),
  notes: notesField,
});

/** Pabili typed by hand: no pickup, the rider chooses a store near the drop-off. */
export const pabiliFormSchema = z.object({
  pabili_category: pabiliCategorySchema,
  dropoff: locationFormSchema,
  items: z.array(bookingItemFormSchema).min(1, 'Add at least one item.').max(20),
  purchase_budget: z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter a peso amount, e.g. 500 or 500.50.'),
  notes: notesField,
});

export const pasuyoFormSchema = z.object({
  pickup: locationFormSchema,
  dropoff: locationFormSchema,
  recipient_name: z.string().trim().min(1, "Enter the recipient's name.").max(120),
  recipient_phone: z.string().transform((value, context) => {
    const normalized = normalizePhilippineMobile(value);

    if (normalized === null) {
      context.addIssue({ code: 'custom', message: 'Enter a valid PH mobile number.' });

      return z.NEVER;
    }

    return normalized;
  }),
  parcel_description: z.string().trim().min(1, 'Describe the parcel.').max(300),
  notes: notesField,
});
