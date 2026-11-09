import { z } from 'zod';

import { normalizePhilippineMobile, PASSWORD_MIN_LENGTH, userSchema } from '@/features/auth';
import { bookingSchema, serviceTypeSchema } from '@/features/booking';
import { storeCategorySchema, storeProductSchema } from '@/features/store';

const moneySchema = z.object({
  centavos: z.number().int(),
  currency: z.literal('PHP'),
  formatted: z.string(),
});

export const dashboardSchema = z.object({
  bookings_today: z.record(z.string(), z.number().int()),
  bookings_in_progress: z.number().int(),
  bookings_searching: z.number().int(),
  riders_online: z.number().int(),
  riders_total: z.number().int(),
  customers_total: z.number().int(),
  revenue_today: moneySchema,
});

export const fareSettingSchema = z.object({
  service_type: serviceTypeSchema,
  base_fare: moneySchema,
  included_distance_meters: z.number().int(),
  per_km: moneySchema,
  service_fee: moneySchema,
  minimum_fare: moneySchema,
  /** Basis points: 1000 = 10%. */
  commission_rate_bps: z.number().int(),
  updated_at: z.string(),
});

export const adminUserSchema = userSchema;

export const adminRiderSchema = userSchema.extend({
  is_online: z.boolean(),
  current_location: z.object({ latitude: z.number(), longitude: z.number() }).nullable(),
  location_updated_at: z.string().nullable(),
  active_job_reference: z.string().optional(),
});

export const adminBookingSchema = bookingSchema;

/** A rider the dispatcher may assign to one booking, on duty or not. */
export const dispatchCandidateSchema = z.object({
  rider: z.object({
    id: z.number().int(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  /** Online in the rider app with a recent heartbeat. Off-duty riders can still be assigned. */
  is_on_duty: z.boolean(),
  /** Null until the rider app has shared a position. */
  distance_to_pickup_meters: z.number().int().nullable(),
  location_updated_at: z.string().nullable(),
  active_job_reference: z.string().nullable(),
  wallet_balance: moneySchema,
  is_available: z.boolean(),
  unavailable_reason: z.string().nullable(),
});

export const adminStoreProductSchema = storeProductSchema;

export const adminStoreSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  category: storeCategorySchema,
  category_label: z.string(),
  address: z.string(),
  landmark: z.string().nullable(),
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  is_active: z.boolean(),
  // Lists carry counts; the detail page carries every item, sold-out ones included.
  products_count: z.number().int().optional(),
  available_products_count: z.number().int().optional(),
  products: z.array(adminStoreProductSchema).optional(),
  created_at: z.string(),
});

/* Forms */

const pesos = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter pesos, e.g. 49 or 49.50.');

export const fareSettingFormSchema = z.object({
  base_fare: pesos,
  included_distance_meters: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Whole metres only.')
    .transform(Number)
    .refine((value) => value <= 50_000, 'At most 50,000 m.'),
  per_km: pesos,
  service_fee: pesos,
  minimum_fare: pesos,
  commission_rate: z
    .string()
    .trim()
    .regex(/^\d{1,2}(\.\d{1,2})?$/, 'Enter a percent from 0 to 99.99, e.g. 10 or 12.5.'),
});

export const createRiderFormSchema = z.object({
  first_name: z.string().trim().min(1, "Enter the rider's first name.").max(60),
  last_name: z.string().trim().min(1, "Enter the rider's last name.").max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().transform((value, context) => {
    const normalized = normalizePhilippineMobile(value);

    if (normalized === null) {
      context.addIssue({ code: 'custom', message: 'Enter a valid PH mobile number.' });

      return z.NEVER;
    }

    return normalized;
  }),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
});

/** Admins can change fares, stores and accounts; the server enforces the same rule. */
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

export const createAdminFormSchema = createRiderFormSchema.extend({
  first_name: z.string().trim().min(1, "Enter the admin's first name.").max(60),
  last_name: z.string().trim().min(1, "Enter the admin's last name.").max(60),
  password: z
    .string()
    .min(ADMIN_PASSWORD_MIN_LENGTH, `Use at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`)
    .regex(/[A-Za-z]/, 'Include at least one letter.')
    .regex(/\d/, 'Include at least one number.'),
});

/** Store form: the pin is required; the address fills from it and may be edited. */
export const storeFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name the store.').max(120),
    category: storeCategorySchema,
    address: z.string().trim().min(3, 'Enter the address.').max(255),
    landmark: z
      .string()
      .trim()
      .max(120, 'Keep the landmark under 120 characters.')
      .transform((value) => (value === '' ? null : value)),
    point: z
      .object({ latitude: z.number(), longitude: z.number() })
      .nullable()
      .refine((point) => point !== null, 'Drop the pin on the store.'),
    is_active: z.boolean(),
  })
  .transform(({ point, ...rest }) => ({
    ...rest,
    // The refine above guarantees a point; the assertion is for the type only.
    latitude: point!.latitude,
    longitude: point!.longitude,
  }));

export const storeProductFormSchema = z.object({
  name: z.string().trim().min(1, 'Name the item.').max(120),
  description: z
    .string()
    .trim()
    .max(255)
    .transform((value) => (value === '' ? null : value)),
  price: pesos,
  is_available: z.boolean(),
});

export const supportCancelFormSchema = z.object({
  reason: z.string().trim().min(3, 'Give a reason (at least 3 characters).').max(300),
});
