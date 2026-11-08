import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { bookingApi } from '../api/bookingApi';
import { TERMINAL_STATUSES } from '../schemas/bookingSchemas';
import type { Booking } from '../types';

import { bookingKeys } from './bookingKeys';

const LIVE_REFRESH_MS = 15_000;

export function useBookings() {
  return useQuery<Booking[], ApiError>({
    queryKey: bookingKeys.list(),
    queryFn: bookingApi.listBookings,
    // Keep polling while any booking is still in progress.
    refetchInterval: (query) =>
      query.state.data?.some((booking) => !TERMINAL_STATUSES.includes(booking.status))
        ? LIVE_REFRESH_MS
        : false,
  });
}
