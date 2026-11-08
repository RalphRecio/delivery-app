import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('renders its label and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Book now" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Book now' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled and shows a spinner while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Book now" onPress={onPress} isLoading />);

    const button = screen.getByRole('button');
    await fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(button).toBeBusy();
    expect(screen.queryByText('Book now')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });
});
