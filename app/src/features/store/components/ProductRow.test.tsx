import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProductRow } from './ProductRow';

const product = {
  id: 1,
  name: 'Eggs',
  description: null,
  price: { centavos: 11500, currency: 'PHP' as const, formatted: '₱115.00' },
  is_available: true,
};

describe('ProductRow', () => {
  it('adds the first unit, then steps up and down', async () => {
    const onChange = jest.fn();
    await render(<ProductRow product={product} quantity={0} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Add Eggs'));
    expect(onChange).toHaveBeenLastCalledWith(1);

    await screen.rerender(<ProductRow product={product} quantity={2} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText('Add one more Eggs'));
    await fireEvent.press(screen.getByLabelText('Remove one Eggs'));

    expect(onChange).toHaveBeenNthCalledWith(2, 3);
    expect(onChange).toHaveBeenNthCalledWith(3, 1);
    expect(screen.getByText('₱115.00')).toBeOnTheScreen();
  });
});
