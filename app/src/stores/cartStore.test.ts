import { selectCartCount, selectCartSubtotalCentavos, useCartStore } from './cartStore';

const store = {
  id: 1,
  name: 'SM Supermarket',
  address: 'SM City Cebu',
  location: { latitude: 10.3119, longitude: 123.918 },
};
const eggs = { id: 10, name: 'Eggs', priceCentavos: 11500 };
const milk = { id: 11, name: 'Milk', priceCentavos: 9800 };

describe('useCartStore', () => {
  beforeEach(() => useCartStore.getState().clear());

  it('adds, changes and removes lines and totals them', () => {
    const { startOrder, setQuantity } = useCartStore.getState();
    startOrder(store);
    setQuantity(eggs, 2);
    setQuantity(milk, 1);

    expect(selectCartCount(useCartStore.getState())).toBe(3);
    expect(selectCartSubtotalCentavos(useCartStore.getState())).toBe(32800);

    setQuantity(eggs, 0);

    expect(Object.keys(useCartStore.getState().lines)).toEqual(['11']);
  });

  it('empties the order when switching to another store, but not the same one', () => {
    const { startOrder, setQuantity } = useCartStore.getState();
    startOrder(store);
    setQuantity(eggs, 1);
    startOrder(store);

    expect(selectCartCount(useCartStore.getState())).toBe(1);

    startOrder({ id: 2, name: 'Other', address: 'x', location: { latitude: 10, longitude: 123 } });

    expect(selectCartCount(useCartStore.getState())).toBe(0);
    expect(useCartStore.getState().store?.id).toBe(2);
  });

  it('caps quantities at 99', () => {
    useCartStore.getState().startOrder(store);
    useCartStore.getState().setQuantity(eggs, 500);

    expect(useCartStore.getState().lines[10]?.quantity).toBe(99);
  });
});
