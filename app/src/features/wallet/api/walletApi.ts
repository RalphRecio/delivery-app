import { apiRequest, apiRequestPaginated } from '@/shared/lib/api';
import type { Paginated } from '@/shared/types/api';

import {
  topupRequestSchema,
  walletSummarySchema,
  walletTransactionSchema,
} from '../schemas/walletSchemas';
import type { TopupRequest, TransactionFilters, WalletSummary, WalletTransaction } from '../types';

export const walletApi = {
  getWallet: (): Promise<WalletSummary> =>
    apiRequest({ method: 'GET', url: '/rider/wallet' }, walletSummarySchema),

  listTransactions: (
    filters: TransactionFilters & { page: number; per_page?: number },
  ): Promise<Paginated<WalletTransaction>> =>
    apiRequestPaginated(
      {
        method: 'GET',
        url: '/rider/wallet/transactions',
        params: {
          page: filters.page,
          per_page: filters.per_page ?? 25,
          ...(filters.type !== undefined ? { type: filters.type } : {}),
        },
      },
      walletTransactionSchema,
    ),

  /** Amount in pesos as typed ("500"); the server converts to centavos. */
  createTopup: (amount: string, returnUrl: string): Promise<TopupRequest> =>
    apiRequest(
      { method: 'POST', url: '/rider/wallet/topups', data: { amount, return_url: returnUrl } },
      topupRequestSchema,
    ),

  getTopup: (id: number): Promise<TopupRequest> =>
    apiRequest({ method: 'GET', url: `/rider/wallet/topups/${id}` }, topupRequestSchema),
};
