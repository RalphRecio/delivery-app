import type { TransactionFilters } from '../types';

/** Query key factory. Anything that moves money (a completed job) invalidates `all`. */
export const walletKeys = {
  all: ['wallet'] as const,
  summary: () => [...walletKeys.all, 'summary'] as const,
  transactions: (filters: TransactionFilters) =>
    [...walletKeys.all, 'transactions', filters] as const,
  topup: (id: number) => [...walletKeys.all, 'topup', id] as const,
};
