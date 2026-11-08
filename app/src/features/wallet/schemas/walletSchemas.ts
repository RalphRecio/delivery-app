import { z } from 'zod';

const moneySchema = z.object({
  centavos: z.number().int(),
  currency: z.literal('PHP'),
  formatted: z.string(),
});

export const walletTransactionTypeSchema = z.enum(['topup', 'commission', 'refund', 'adjustment']);

export const topupStatusSchema = z.enum(['pending', 'paid', 'failed', 'expired']);

export const walletSummarySchema = z.object({
  balance: moneySchema,
  minimum_balance: moneySchema,
  can_accept_bookings: z.boolean(),
  shortfall: moneySchema,
  topup_limits: z.object({ min: moneySchema, max: moneySchema }),
});

export const walletTransactionSchema = z.object({
  id: z.number().int(),
  type: walletTransactionTypeSchema,
  type_label: z.string(),
  amount: moneySchema,
  reason: z.string().nullable(),
  booking: z
    .object({
      id: z.number().int(),
      reference: z.string(),
      service_type: z.string(),
      total_fare: moneySchema,
      commission_rate_bps: z.number().int().nullable(),
    })
    .nullable(),
  topup: z.object({ id: z.number().int(), reference: z.string(), gateway: z.string() }).nullable(),
  created_at: z.string(),
});

export const topupRequestSchema = z.object({
  id: z.number().int(),
  amount: moneySchema,
  status: topupStatusSchema,
  status_label: z.string(),
  reference: z.string(),
  checkout_url: z.string().nullable(),
  failure_reason: z.string().nullable(),
  expires_at: z.string(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
});

/** Pesos as typed: "500" or "500.50". Limits are checked against the server's values. */
export const topupAmountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter an amount in pesos, e.g. 500 or 500.50.');
