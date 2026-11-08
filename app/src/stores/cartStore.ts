import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/** What the cart needs to know about a product; prices are re-read by the server on booking. */
export interface CartProduct {
  id: number;
  name: string;
  priceCentavos: number;
}

export interface CartStore {
  id: number;
  name: string;
  address: string;
  location: { latitude: number; longitude: number };
}

interface CartLine {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  /** The store the current order is from; one store per order, like Grab. */
  store: CartStore | null;
  lines: Record<number, CartLine>;
  startOrder: (store: CartStore) => void;
  setQuantity: (product: CartProduct, quantity: number) => void;
  clear: () => void;
}

const MAX_QUANTITY = 99;

/**
 * Client-only state: the Pabili order being assembled while the customer
 * browses a store. Switching store empties it. Nothing here is server data.
 */
export const useCartStore = create<CartState>()((set) => ({
  store: null,
  lines: {},

  startOrder: (store) =>
    set((state) => (state.store?.id === store.id ? state : { store, lines: {} })),

  setQuantity: (product, quantity) =>
    set((state) => {
      const lines = { ...state.lines };
      const clamped = Math.max(0, Math.min(MAX_QUANTITY, Math.floor(quantity)));

      if (clamped === 0) {
        delete lines[product.id];
      } else {
        lines[product.id] = { product, quantity: clamped };
      }

      return { lines };
    }),

  clear: () => set({ store: null, lines: {} }),
}));

export function selectCartLines(state: CartState): CartLine[] {
  return Object.values(state.lines);
}

export function selectCartCount(state: CartState): number {
  return Object.values(state.lines).reduce((sum, line) => sum + line.quantity, 0);
}

export function selectCartSubtotalCentavos(state: CartState): number {
  return Object.values(state.lines).reduce(
    (sum, line) => sum + line.product.priceCentavos * line.quantity,
    0,
  );
}

/**
 * Selecting the lines as an array makes a new array every call, which Zustand
 * treats as a change on every render; the shallow comparison stops the loop.
 */
export function useCartLines(): CartLine[] {
  return useCartStore(useShallow(selectCartLines));
}
