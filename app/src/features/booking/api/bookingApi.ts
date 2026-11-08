import { z } from 'zod';

import { apiRequest } from '@/shared/lib/api';

import { bookingSchema, fareQuoteSchema } from '../schemas/bookingSchemas';
import type {
  Booking,
  FareQuote,
  FareQuoteInput,
  PabiliBookingInput,
  PabiliStoreOrderInput,
  PasuyoBookingInput,
} from '../types';

const IDEMPOTENCY_HEADER = 'Idempotency-Key';

export const bookingApi = {
  quoteFare: (input: FareQuoteInput): Promise<FareQuote> =>
    apiRequest({ method: 'POST', url: '/customer/bookings/quote', data: input }, fareQuoteSchema),

  createPabiliBooking: (
    input: PabiliBookingInput | PabiliStoreOrderInput,
    idempotencyKey: string,
  ): Promise<Booking> =>
    apiRequest(
      {
        method: 'POST',
        url: '/customer/bookings/pabili',
        data: input,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
      },
      bookingSchema,
    ),

  createPasuyoBooking: (input: PasuyoBookingInput, idempotencyKey: string): Promise<Booking> =>
    apiRequest(
      {
        method: 'POST',
        url: '/customer/bookings/pasuyo',
        data: input,
        headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
      },
      bookingSchema,
    ),

  listBookings: (): Promise<Booking[]> =>
    apiRequest({ method: 'GET', url: '/customer/bookings' }, z.array(bookingSchema)),

  getBooking: (id: number): Promise<Booking> =>
    apiRequest({ method: 'GET', url: `/customer/bookings/${id}` }, bookingSchema),

  cancelBooking: (id: number, reason: string | null): Promise<Booking> =>
    apiRequest(
      { method: 'POST', url: `/customer/bookings/${id}/cancel`, data: { reason } },
      bookingSchema,
    ),
};
