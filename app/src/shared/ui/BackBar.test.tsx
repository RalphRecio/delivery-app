import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { BackBar } from './BackBar';

jest.mock('expo-router', () => ({
  router: { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

const mockedRouter = jest.mocked(router);

describe('BackBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('goes back when there is history', async () => {
    mockedRouter.canGoBack.mockReturnValue(true);
    await render(<BackBar fallbackHref="/customer" />);

    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(mockedRouter.back).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  it('goes to the fallback when the page was opened directly', async () => {
    mockedRouter.canGoBack.mockReturnValue(false);
    await render(<BackBar fallbackHref="/customer/bookings" label="Bookings" />);

    await fireEvent.press(screen.getByRole('button', { name: 'Bookings' }));

    expect(mockedRouter.replace).toHaveBeenCalledWith('/customer/bookings');
    expect(mockedRouter.back).not.toHaveBeenCalled();
  });
});
