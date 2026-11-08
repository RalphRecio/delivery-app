import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { bookingApi } from '../api/bookingApi';
import { TERMINAL_STATUSES } from '../schemas/bookingSchemas';
import type { Booking } from '../types';

import { bookingKeys } from './bookingKeys';

const LIVE_REFRESH_MS = 10_000;

/** Polls while the booking is still moving, so the customer sees the rider's progress. */
export function useBooking(id: number) {
  return useQuery<Booking, ApiError>({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingApi.getBooking(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === undefined || TERMINAL_STATUSES.includes(status) ? false : LIVE_REFRESH_MS;
    },
  });
}
