import axios, { isAxiosError } from 'axios';

import { API_BASE_URL } from '@/config/apiBaseUrl';
import { apiErrorEnvelopeSchema } from '@/shared/types/api';
import { useAuthStore } from '@/stores/authStore';

import { ApiError } from './ApiError';

const REQUEST_TIMEOUT_MS = 15_000;

// axios.create() is the only way to get an instance that inherits the default
// transformers; the named `create` export the lint rule suggests is not typed.
// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.token;

  if (token !== undefined) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeError(error);

    // A rejected token means the stored session is dead. Clearing it here sends
    // the user back to login from any screen, which is the one place this
    // cross-cutting rule should live.
    if (apiError.isUnauthenticated) {
      void useAuthStore.getState().clearSession();
    }

    return Promise.reject(apiError);
  },
);

/** Turns whatever Axios throws into an ApiError so callers never see Axios types. */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (!isAxiosError(error)) {
    return new ApiError('network', 'Something went wrong. Please try again.');
  }

  if (error.response === undefined) {
    return new ApiError('network', 'Cannot reach the server. Check your connection.');
  }

  const envelope = apiErrorEnvelopeSchema.safeParse(error.response.data);

  if (envelope.success) {
    return new ApiError('http', envelope.data.message, error.response.status, envelope.data.errors);
  }

  return new ApiError(
    'http',
    `Request failed with status ${error.response.status}.`,
    error.response.status,
  );
}
