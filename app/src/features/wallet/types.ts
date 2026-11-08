import type { z } from 'zod';

import type {
  topupRequestSchema,
  topupStatusSchema,
  walletSummarySchema,
  walletTransactionSchema,
  walletTransactionTypeSchema,
} from './schemas/walletSchemas';

export type WalletSummary = z.infer<typeof walletSummarySchema>;
export type WalletTransaction = z.infer<typeof walletTransactionSchema>;
export type WalletTransactionType = z.infer<typeof walletTransactionTypeSchema>;
export type TopupRequest = z.infer<typeof topupRequestSchema>;
export type TopupStatus = z.infer<typeof topupStatusSchema>;

export interface TransactionFilters {
  type?: WalletTransactionType;
}
