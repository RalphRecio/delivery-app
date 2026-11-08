import type { FieldErrors } from '@/shared/types/api';

/**
 * - `http`: the server answered with an error envelope (4xx / 5xx).
 * - `network`: no response at all (offline, timeout, DNS).
 * - `contract`: the server answered but the body did not match the Zod schema.
 */
export type ApiErrorKind = 'http' | 'network' | 'contract';

const HTTP_UNAUTHORIZED = 401;
const HTTP_UNPROCESSABLE = 422;
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_CLIENT_ERROR_MAX = 499;

export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status: number | null = null,
    readonly errors: FieldErrors = {},
  ) {
    super(message);
  }

  get isNetworkError(): boolean {
    return this.kind === 'network';
  }

  get isUnauthenticated(): boolean {
    return this.status === HTTP_UNAUTHORIZED;
  }

  get isValidationError(): boolean {
    return this.status === HTTP_UNPROCESSABLE;
  }

  get isClientError(): boolean {
    return (
      this.status !== null &&
      this.status >= HTTP_CLIENT_ERROR_MIN &&
      this.status <= HTTP_CLIENT_ERROR_MAX
    );
  }

  /** First message for a field, handy for showing inline form errors. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}
