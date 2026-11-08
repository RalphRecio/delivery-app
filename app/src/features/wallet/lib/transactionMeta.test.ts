import type { WalletTransaction } from '../types';

import { groupByDay, signedAmount } from './transactionMeta';

const money = (centavos: number, formatted: string) => ({
  centavos,
  currency: 'PHP' as const,
  formatted,
});

const tx = (
  id: number,
  createdAt: string,
  centavos = -790,
  formatted = '-₱7.90',
): WalletTransaction => ({
  id,
  type: centavos > 0 ? 'topup' : 'commission',
  type_label: centavos > 0 ? 'Top-up' : 'Commission',
  amount: money(centavos, formatted),
  reason: null,
  booking: null,
  topup: null,
  created_at: createdAt,
});

describe('wallet transaction display', () => {
  it('always shows the sign', () => {
    expect(signedAmount(tx(1, '2026-11-03T08:00:00', 50000, '₱500.00'))).toBe('+₱500.00');
    expect(signedAmount(tx(2, '2026-11-03T08:00:00'))).toBe('-₱7.90');
  });

  it('groups by day as Today, Yesterday, then the date, keeping newest first', () => {
    const now = new Date(2026, 10, 3, 12, 0);
    const groups = groupByDay(
      [
        tx(4, new Date(2026, 10, 3, 9, 0).toISOString()),
        tx(3, new Date(2026, 10, 3, 8, 0).toISOString()),
        tx(2, new Date(2026, 10, 2, 20, 0).toISOString()),
        tx(1, new Date(2026, 9, 30, 7, 0).toISOString()),
      ],
      now,
    );

    expect(groups.map((g) => [g.title, g.data.map((t) => t.id)])).toEqual([
      ['Today', [4, 3]],
      ['Yesterday', [2]],
      [
        new Date(2026, 9, 30).toLocaleDateString('en-PH', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        [1],
      ],
    ]);
  });
});
