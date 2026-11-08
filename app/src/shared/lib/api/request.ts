import type { AxiosRequestConfig } from 'axios';
import { z } from 'zod';

import { apiEnvelopeSchema, paginationMetaSchema, type Paginated } from '@/shared/types/api';

import { ApiError } from './ApiError';
import { apiClient } from './client';

/**
 * The only way features talk to the backend. The response is validated
 * against the feature's Zod schema, so everything above this line can trust
 * the inferred types.
 */
export async function apiRequest<TData>(
  config: AxiosRequestConfig,
  dataSchema: z.ZodType<TData>,
): Promise<TData> {
  const response = await apiClient.request<unknown>(config);
  const parsed = apiEnvelopeSchema(dataSchema).safeParse(response.data);

  if (!parsed.success) {
    throw new ApiError('contract', 'The server returned an unexpected response.', response.status);
  }

  return parsed.data.data;
}

/** Same as apiRequest, for list endpoints that paginate: keeps the page totals. */
export async function apiRequestPaginated<TItem>(
  config: AxiosRequestConfig,
  itemSchema: z.ZodType<TItem>,
): Promise<Paginated<TItem>> {
  const response = await apiClient.request<unknown>(config);
  const parsed = apiEnvelopeSchema(z.array(itemSchema))
    .extend({ meta: paginationMetaSchema })
    .safeParse(response.data);

  if (!parsed.success) {
    throw new ApiError('contract', 'The server returned an unexpected response.', response.status);
  }

  return { data: parsed.data.data, meta: parsed.data.meta };
}
