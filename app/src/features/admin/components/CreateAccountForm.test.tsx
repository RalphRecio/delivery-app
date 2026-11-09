import { fireEvent, render, screen } from '@testing-library/react-native';

import { CreateAccountForm } from './CreateAccountForm';

const mockCreateRider = { mutate: jest.fn(), reset: jest.fn(), isPending: false, isError: false };
const mockCreateAdmin = { mutate: jest.fn(), reset: jest.fn(), isPending: false, isError: false };

jest.mock('../hooks/useAdminQueries', () => ({
  useCreateRider: () => mockCreateRider,
  useCreateAdmin: () => mockCreateAdmin,
}));

async function fill(password: string) {
  await fireEvent.changeText(screen.getByLabelText('First name'), 'Amy');
  await fireEvent.changeText(screen.getByLabelText('Last name'), 'Admin');
  await fireEvent.changeText(screen.getByLabelText('Email'), ' Amy@Example.com ');
  await fireEvent.changeText(screen.getByLabelText('Mobile number'), '0917 555 0009');
  await fireEvent.changeText(screen.getByLabelText('First password'), password);
}

describe('CreateAccountForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('holds admins to the stronger password rule before calling the API', async () => {
    await render(<CreateAccountForm role="admin" />);
    await fill('password1');

    await fireEvent.press(screen.getByText('Create admin'));

    expect(screen.getByText('Use at least 12 characters.')).toBeTruthy();
    expect(mockCreateAdmin.mutate).not.toHaveBeenCalled();
  });

  it('creates an admin with normalised details', async () => {
    await render(<CreateAccountForm role="admin" />);
    await fill('long-enough-pass-42');

    await fireEvent.press(screen.getByText('Create admin'));

    expect(mockCreateAdmin.mutate).toHaveBeenCalledWith(
      {
        first_name: 'Amy',
        last_name: 'Admin',
        email: 'amy@example.com',
        phone: '+639175550009',
        password: 'long-enough-pass-42',
      },
      expect.anything(),
    );
    expect(mockCreateRider.mutate).not.toHaveBeenCalled();
  });

  it('keeps the 8-character rule for riders', async () => {
    await render(<CreateAccountForm role="rider" />);
    await fill('password');

    await fireEvent.press(screen.getByText('Create rider'));

    expect(mockCreateRider.mutate).toHaveBeenCalled();
    expect(mockCreateAdmin.mutate).not.toHaveBeenCalled();
  });
});
