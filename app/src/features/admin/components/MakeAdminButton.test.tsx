import { fireEvent, render, screen } from '@testing-library/react-native';

import { MakeAdminButton } from './MakeAdminButton';

const mockMakeAdmin = {
  mutate: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  isError: false,
  error: null,
};

jest.mock('../hooks/useAdminQueries', () => ({
  useMakeAdmin: () => mockMakeAdmin,
}));

describe('MakeAdminButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks before making a customer an admin', async () => {
    await render(<MakeAdminButton userId={5} name="Ralph Recio" />);

    await fireEvent.press(screen.getByText('Make admin'));

    expect(screen.getByText('Give Ralph Recio full admin access?')).toBeTruthy();
    expect(mockMakeAdmin.mutate).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Yes, make admin'));

    expect(mockMakeAdmin.mutate).toHaveBeenCalledWith(5, expect.anything());
  });

  it('can be cancelled without changing anything', async () => {
    await render(<MakeAdminButton userId={5} name="Ralph Recio" />);

    await fireEvent.press(screen.getByText('Make admin'));
    await fireEvent.press(screen.getByText('Cancel'));

    expect(screen.getByText('Make admin')).toBeTruthy();
    expect(mockMakeAdmin.mutate).not.toHaveBeenCalled();
  });
});
