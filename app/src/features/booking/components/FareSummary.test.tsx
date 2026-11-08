import { render, screen } from '@testing-library/react-native';

import { FareSummary } from './FareSummary';

const money = (centavos: number, formatted: string) => ({
  centavos,
  currency: 'PHP' as const,
  formatted,
});

describe('FareSummary', () => {
  it('shows each part of the fare and hides a zero service fee', async () => {
    await render(
      <FareSummary
        fare={{
          distance_meters: 3000,
          base_fare: money(4900, '₱49.00'),
          distance_fare: money(1000, '₱10.00'),
          service_fee: money(0, '₱0.00'),
          total: money(5900, '₱59.00'),
        }}
      />,
    );

    expect(screen.getByText('Base fare (3.0 km)')).toBeOnTheScreen();
    expect(screen.getByText('₱10.00')).toBeOnTheScreen();
    expect(screen.getByText('₱59.00')).toBeOnTheScreen();
    expect(screen.queryByText('Service fee')).toBeNull();
  });
});
