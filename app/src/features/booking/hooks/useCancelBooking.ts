import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { bookingApi } from '../api/bookingApi';
import type { Booking } from '../types';

import { bookingKeys } from './bookingKeys';

interface CancelBookingVariables {
  id: number;
  reason: string | null;
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation<Booking, ApiError, CancelBookingVariables>({
    mutationFn: ({ id, reason }) => bookingApi.cancelBooking(id, reason),
    onSuccess: async (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      await queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
    },
  });
}
