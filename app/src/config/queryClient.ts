import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/lib/api/ApiError';

const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 2;

/**
 * One client for the whole app. Retries are skipped for responses the server
 * answered deliberately (4xx); retrying those only delays the error state.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.isClientError) {
          return false;
        }

        return failureCount < MAX_RETRIES;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
