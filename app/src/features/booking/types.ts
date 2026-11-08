import type { z } from 'zod';

import type {
  bookingItemFormSchema,
  bookingSchema,
  bookingStatusLogSchema,
  bookingStatusSchema,
  contactSchema,
  fareBreakdownSchema,
  fareQuoteSchema,
  locationFormSchema,
  moneySchema,
  pabiliCategorySchema,
  pabiliFormSchema,
  pabiliStoreOrderFormSchema,
  pasuyoFormSchema,
  serviceTypeSchema,
} from './schemas/bookingSchemas';

export type Money = z.infer<typeof moneySchema>;
export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type PabiliCategory = z.infer<typeof pabiliCategorySchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type FareBreakdown = z.infer<typeof fareBreakdownSchema>;
export type FareQuote = z.infer<typeof fareQuoteSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type BookingStatusLog = z.infer<typeof bookingStatusLogSchema>;

/** Parsed form output (what the API receives). */
export type LocationInput = z.output<typeof locationFormSchema>;
export type PabiliBookingInput = z.output<typeof pabiliFormSchema>;
/** Store order: no pickup (the server takes the store's), plus store_id and catalogue lines. */
export type PabiliStoreOrderInput = Omit<z.output<typeof pabiliStoreOrderFormSchema>, 'items'> & {
  store_id: number;
  items: ({ product_id: number; quantity: number } | BookingItemInput)[];
};
export type PasuyoBookingInput = z.output<typeof pasuyoFormSchema>;
export type BookingItemInput = z.output<typeof bookingItemFormSchema>;

/** Raw form state (strings from text fields, pin from the map). */
export type LocationFormValues = z.input<typeof locationFormSchema>;
export type BookingItemFormValues = z.input<typeof bookingItemFormSchema>;

export interface FareQuoteInput {
  service_type: ServiceType;
  /** Absent for a Pabili without a store: the server quotes from the drop-off alone. */
  pickup?: { latitude: number; longitude: number };
  dropoff: { latitude: number; longitude: number };
}
