import { fireEvent, render, screen } from '@testing-library/react-native';

import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
  it('flags every empty or invalid field without submitting', async () => {
    const onSubmit = jest.fn();
    await render(<RegisterForm accountType="customer" onSubmit={onSubmit} isSubmitting={false} />);

    await fireEvent.changeText(screen.getByLabelText('Email'), 'not-an-email');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'short');
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter your first name.')).toBeOnTheScreen();
    expect(screen.getByText('Enter your last name.')).toBeOnTheScreen();
    expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(screen.getByText('Use at least 8 characters.')).toBeOnTheScreen();
    expect(screen.getByText('Enter a valid PH mobile number.')).toBeOnTheScreen();
  });

  it('submits trimmed, normalised values', async () => {
    const onSubmit = jest.fn();
    await render(<RegisterForm accountType="customer" onSubmit={onSubmit} isSubmitting={false} />);

    await fireEvent.changeText(screen.getByLabelText('First name'), ' Juan ');
    await fireEvent.changeText(screen.getByLabelText('Last name'), 'dela Cruz');
    await fireEvent.changeText(screen.getByLabelText('Email'), ' Juan@Example.com ');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'correct horse');
    await fireEvent.changeText(screen.getByLabelText('Mobile number'), '0917 123 4567');
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    expect(onSubmit).toHaveBeenCalledWith({
      account_type: 'customer',
      first_name: 'Juan',
      last_name: 'dela Cruz',
      email: 'juan@example.com',
      password: 'correct horse',
      phone: '+639171234567',
    });
  });

  it('submits the account type the page decided', async () => {
    const onSubmit = jest.fn();
    await render(<RegisterForm accountType="rider" onSubmit={onSubmit} isSubmitting={false} />);

    await fireEvent.changeText(screen.getByLabelText('First name'), 'Rico');
    await fireEvent.changeText(screen.getByLabelText('Last name'), 'Rider');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'rico@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'correct horse');
    await fireEvent.changeText(screen.getByLabelText('Mobile number'), '0917 555 0001');
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ account_type: 'rider' }));
  });
});
