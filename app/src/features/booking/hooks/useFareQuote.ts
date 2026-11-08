import { useMutation } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { bookingApi } from '../api/bookingApi';
import type { FareQuote, FareQuoteInput } from '../types';

/** A mutation rather than a query: the quote is requested on demand, when the form is complete. */
export function useFareQuote() {
  return useMutation<FareQuote, ApiError, FareQuoteInput>({
    mutationFn: bookingApi.quoteFare,
  });
}
