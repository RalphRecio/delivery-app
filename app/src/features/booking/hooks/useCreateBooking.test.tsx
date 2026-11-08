import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { bookingApi } from '../api/bookingApi';
import type { Booking } from '../types';

import { bookingKeys } from './bookingKeys';
import { useCreateBooking } from './useCreateBooking';

jest.mock('../api/bookingApi');

const mockedApi = jest.mocked(bookingApi);

const money = (centavos: number) => ({
  centavos,
  currency: 'PHP' as const,
  formatted: `₱${centavos / 100}`,
});

const booking: Booking = {
  id: 7,
  reference: 'BK-ABCDEFGH',
  service_type: 'pasuyo',
  service_label: 'Pasuyo',
  pabili_category: null,
  pabili_category_label: null,
  status: 'pending',
  status_label: 'Pending',
  can_cancel: true,
  payment_method: 'cash',
  pickup: { address: 'A', landmark: null, details: null, point: { latitude: 10, longitude: 123 } },
  dropoff: {
    address: 'B',
    landmark: null,
    details: null,
    point: { latitude: 10.1, longitude: 123.1 },
  },
  fare: {
    distance_meters: 2100,
    base_fare: money(4900),
    distance_fare: money(100),
    service_fee: money(0),
    total: money(5000),
  },
  notes: null,
  items: null,
  purchase_budget: null,
  recipient_name: 'Juan',
  recipient_phone: '+639171234567',
  parcel_description: 'Docs',
  cancellation_reason: null,
  cancelled_at: null,
  created_at: '2026-11-02T00:00:00+00:00',
  search_radius_meters: null,
};

const input = {
  pickup: { address: 'A', landmark: null, details: null, latitude: 10, longitude: 123 },
  dropoff: { address: 'B', landmark: null, details: null, latitude: 10.1, longitude: 123.1 },
  recipient_name: 'Juan',
  recipient_phone: '+639171234567',
  parcel_description: 'Docs',
  notes: null,
};

describe('useCreateBooking', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    mockedApi.createPasuyoBooking.mockResolvedValue(booking);
  });

  afterEach(() => queryClient.clear());

  it('reuses one idempotency key across retries and seeds the detail cache', async () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useCreateBooking(), { wrapper });

    result.current.mutate({ service_type: 'pasuyo', input });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.mutate({ service_type: 'pasuyo', input });
    await waitFor(() => expect(mockedApi.createPasuyoBooking).toHaveBeenCalledTimes(2));

    const [firstCall, secondCall] = mockedApi.createPasuyoBooking.mock.calls;

    expect(firstCall?.[0]).toEqual(input);
    expect(firstCall?.[1]).toMatch(/^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/);
    expect(secondCall?.[1]).toBe(firstCall?.[1]);
    expect(queryClient.getQueryData(bookingKeys.detail(7))).toEqual(booking);
  });
});
