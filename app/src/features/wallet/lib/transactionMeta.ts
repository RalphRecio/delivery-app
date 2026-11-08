import type { Ionicons } from '@expo/vector-icons';

import { colors } from '@/config/theme';

import type { WalletTransaction, WalletTransactionType } from '../types';

interface TransactionMeta {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Colour of the amount and icon: green in, red out, neutral for corrections. */
  color: string;
  background: string;
}

const META: Record<WalletTransactionType, TransactionMeta> = {
  topup: {
    label: 'Top-up',
    icon: 'add-circle-outline',
    color: colors.success,
    background: colors.successSoft,
  },
  commission: {
    label: 'Commission',
    icon: 'remove-circle-outline',
    color: colors.danger,
    background: colors.dangerSoft,
  },
  refund: {
    label: 'Commission refund',
    icon: 'arrow-undo-outline',
    color: colors.success,
    background: colors.successSoft,
  },
  adjustment: {
    label: 'Adjustment',
    icon: 'construct-outline',
    color: colors.text,
    background: colors.warningSoft,
  },
};

export function transactionMeta(type: WalletTransactionType): TransactionMeta {
  return META[type];
}

/** "+₱500.00" or "-₱7.90": the sign always shows, so direction is never ambiguous. */
export function signedAmount(transaction: WalletTransaction): string {
  const { centavos, formatted } = transaction.amount;

  return centavos > 0 ? `+${formatted}` : formatted;
}

export interface TransactionDay {
  title: string;
  data: WalletTransaction[];
}

/** Groups newest-first transactions into "Today", "Yesterday", then dates, keeping order. */
export function groupByDay(transactions: WalletTransaction[], now: Date): TransactionDay[] {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const groups: TransactionDay[] = [];

  for (const transaction of transactions) {
    const date = new Date(transaction.created_at);
    const key = dayKey(date);
    const title =
      key === today
        ? 'Today'
        : key === yesterday
          ? 'Yesterday'
          : date.toLocaleDateString('en-PH', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
    const last = groups[groups.length - 1];

    if (last !== undefined && last.title === title) {
      last.data.push(transaction);
    } else {
      groups.push({ title, data: [transaction] });
    }
  }

  return groups;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
