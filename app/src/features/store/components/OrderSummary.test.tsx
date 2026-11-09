import { render, screen } from '@testing-library/react-native';

import { useCartStore } from '@/stores/cartStore';

import { OrderSummary } from './OrderSummary';

const store = {
  id: 8,
  name: "Kok's Chicken House",
  address: 'Parang, Maguindanao del Norte',
  location: { latitude: 7.380713, longitude: 124.267359 },
};

describe('OrderSummary', () => {
  afterEach(() => useCartStore.getState().clear());

  it('asks for a typed list when the order has no menu items', async () => {
    useCartStore.getState().startOrder(store);

    await render(<OrderSummary onChangeStore={jest.fn()} />);

    expect(screen.getByText("Kok's Chicken House")).toBeTruthy();
    expect(screen.getByText('Type what you want below and the rider buys it here.')).toBeTruthy();
    expect(screen.queryByText('Items subtotal')).toBeNull();
  });

  it('lists menu items with a subtotal', async () => {
    useCartStore.getState().startOrder(store);
    useCartStore.getState().setQuantity({ id: 1, name: 'Chicken, 1pc', priceCentavos: 9500 }, 2);

    await render(<OrderSummary onChangeStore={jest.fn()} />);

    expect(screen.getByText('Chicken, 1pc')).toBeTruthy();
    expect(screen.getByText('Items subtotal')).toBeTruthy();
    expect(screen.queryByText('Type what you want below and the rider buys it here.')).toBeNull();
  });
});
