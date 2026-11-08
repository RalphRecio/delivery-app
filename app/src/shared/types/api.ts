import { z } from 'zod';

/**
 * Every backend response has the same four keys. Features describe only the
 * `data` part; the envelope is validated here once.
 */
const fieldErrorsSchema = z.record(z.string(), z.array(z.string()));

export type FieldErrors = z.infer<typeof fieldErrorsSchema>;

export const apiEnvelopeSchema = <TData extends z.ZodType>(data: TData) =>
  z.object({
    success: z.literal(true),
    message: z.string().nullable(),
    data,
    errors: fieldErrorsSchema,
  });

/** Laravel's paginator keys, kept next to the envelope keys on list endpoints. */
export const paginationMetaSchema = z.object({
  current_page: z.number().int(),
  last_page: z.number().int(),
  per_page: z.number().int(),
  total: z.number().int(),
  from: z.number().int().nullable(),
  to: z.number().int().nullable(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export interface Paginated<TItem> {
  data: TItem[];
  meta: PaginationMeta;
}

export const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  data: z.null(),
  errors: fieldErrorsSchema,
});

export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
