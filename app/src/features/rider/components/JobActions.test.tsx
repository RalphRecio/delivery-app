import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';

import type { Booking } from '@/features/booking';
import { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';

import { JobActions } from './JobActions';

jest.mock('../api/riderApi');

const mockedApi = jest.mocked(riderApi);

const job = { id: 9, status: 'searching' } as Booking;

describe('JobActions', () => {
  it('offers a top-up when accepting is refused for a low wallet balance', async () => {
    const message = 'Your wallet balance is ₱120.00. Top up to at least ₱150.00 to accept jobs.';
    mockedApi.acceptJob.mockRejectedValue(
      new ApiError('http', message, 409, { wallet_balance: [message] }),
    );
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    await render(<JobActions job={job} isMine={false} />, { wrapper });
    await fireEvent.press(screen.getByRole('button', { name: 'Accept job' }));

    await waitFor(() => expect(screen.getByText(message)).toBeOnTheScreen());
    await fireEvent.press(screen.getByRole('button', { name: 'Top up' }));

    expect(router.push).toHaveBeenCalledWith('/rider/wallet/topup');
    queryClient.clear();
  });
});
