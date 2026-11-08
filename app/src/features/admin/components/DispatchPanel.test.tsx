import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { adminApi } from '../api/adminApi';
import { adminKeys } from '../hooks/adminKeys';
import type { AdminBooking, DispatchCandidate } from '../types';

import { DispatchPanel } from './DispatchPanel';

jest.mock('../api/adminApi');

const mockedApi = jest.mocked(adminApi);

const money = (centavos: number) => ({
  centavos,
  currency: 'PHP' as const,
  formatted: `₱${(centavos / 100).toFixed(2)}`,
});

const candidate = (overrides: Partial<DispatchCandidate>): DispatchCandidate => ({
  rider: { id: 1, name: 'Ana Reyes', phone: null },
  is_on_duty: true,
  distance_to_pickup_meters: 650,
  location_updated_at: null,
  active_job_reference: null,
  wallet_balance: money(50_000),
  is_available: true,
  unavailable_reason: null,
  ...overrides,
});

async function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  await render(
    <QueryClientProvider client={queryClient}>
      <DispatchPanel bookingId={9} />
    </QueryClientProvider>,
  );

  return queryClient;
}

describe('DispatchPanel', () => {
  afterEach(() => jest.clearAllMocks());

  it('assigns only after the dispatcher confirms', async () => {
    mockedApi.listRiderCandidates.mockResolvedValue([
      candidate({}),
      candidate({
        rider: { id: 2, name: 'Ben Cruz', phone: null },
        distance_to_pickup_meters: 1_800,
        active_job_reference: 'BK-OTHER001',
        is_available: false,
        unavailable_reason: 'On job BK-OTHER001',
      }),
    ]);
    mockedApi.assignRider.mockResolvedValue({ id: 9, status: 'accepted' } as AdminBooking);
    const queryClient = await renderPanel();

    expect(await screen.findByText(/650 m from pickup/)).toBeTruthy();
    expect(screen.getByText('On job BK-OTHER001')).toBeTruthy();
    // Busy riders are shown but cannot be assigned.
    expect(screen.getAllByText('Assign')).toHaveLength(1);
    expect(screen.getAllByText('On duty')).toHaveLength(2);

    await fireEvent.press(screen.getByText('Assign'));
    expect(mockedApi.assignRider).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Confirm'));
    expect(mockedApi.assignRider).toHaveBeenCalledWith(9, 1);
    await waitFor(() =>
      expect(queryClient.getQueryData(adminKeys.booking(9))).toEqual({ id: 9, status: 'accepted' }),
    );
  });

  it('lets the dispatcher assign an offline rider', async () => {
    mockedApi.listRiderCandidates.mockResolvedValue([
      candidate({ is_on_duty: false, distance_to_pickup_meters: null }),
    ]);
    mockedApi.assignRider.mockResolvedValue({ id: 9, status: 'accepted' } as AdminBooking);
    await renderPanel();

    expect(await screen.findByText('Offline')).toBeTruthy();
    await fireEvent.press(screen.getByText('Assign'));
    await fireEvent.press(screen.getByText('Confirm'));
    expect(mockedApi.assignRider).toHaveBeenCalledWith(9, 1);
  });

  it('says so when there are no riders at all', async () => {
    mockedApi.listRiderCandidates.mockResolvedValue([]);
    await renderPanel();

    expect(await screen.findByText(/no active rider accounts yet/)).toBeTruthy();
  });
});
