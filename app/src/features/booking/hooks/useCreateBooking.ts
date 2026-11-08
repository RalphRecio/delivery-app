import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import type { ApiError } from '@/shared/lib/api';
import { createIdempotencyKey } from '@/shared/lib/idempotency';

import { bookingApi } from '../api/bookingApi';
import type {
  Booking,
  PabiliBookingInput,
  PabiliStoreOrderInput,
  PasuyoBookingInput,
} from '../types';

import { bookingKeys } from './bookingKeys';

export type CreateBookingVariables =
  | { service_type: 'pabili'; input: PabiliBookingInput | PabiliStoreOrderInput }
  | { service_type: 'pasuyo'; input: PasuyoBookingInput };

/**
 * One idempotency key per form session: if the user taps Confirm twice or
 * the first attempt times out after reaching the server, the retry returns
 * the same booking instead of creating a second one.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  const idempotencyKey = useRef(createIdempotencyKey());

  return useMutation<Booking, ApiError, CreateBookingVariables>({
    mutationFn: (variables) =>
      variables.service_type === 'pabili'
        ? bookingApi.createPabiliBooking(variables.input, idempotencyKey.current)
        : bookingApi.createPasuyoBooking(variables.input, idempotencyKey.current),
    onSuccess: async (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      await queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
    },
  });
}
