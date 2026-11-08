# ADR 0012: Store catalogue for Pabili orders

Date: 2026-11-02 · Status: accepted

## Decision

- Pabili starts from a list of stores (Grab-style): the customer picks a store, adds products with quantity steppers, and continues to booking with the order prefilled. The store's address and location become the booking's pickup; the customer only pins the drop-off.
- Catalogue lives in `stores` and `store_products` (`Domain\Store`). Customers read it through `GET /customer/stores` (active stores, nearest first when the app sends a point, searchable) and `GET /customer/stores/{id}` (available products in order).
- A store order is still `POST /customer/bookings/pabili` with `store_id` and items that carry `product_id`. The server re-reads each product from the store, snapshots its name and price onto the booking, sums an `items_subtotal`, and rejects products that are not available (422) and budgets below the subtotal (422). Custom lines without a product id are allowed alongside, for things not on the menu.
- The free-text Pabili form remains reachable ("Can't find the store? Describe it instead") so a customer can still order from an unlisted shop.
- The in-progress order is client state in a Zustand store (`cartStore`): one store per order, switching store empties it, cleared after booking.
- Five Cebu stores with menus are seeded; admin catalogue management is a later phase.

## Why

- Choosing from a menu is faster and less error-prone than typing a list, and it gives riders exact product names and prices.
- Snapshotting prices on the booking keeps history honest when a menu changes, the same reason fares are snapshotted.
- Keeping the order in the cart store rather than route params lets the customer browse, go back, and change quantities without losing anything, and keeps server data out of client state.

## Consequences

- Items in a booking now have two shapes: catalogue (product id, unit price) and custom (name only). The rider screen shows prices where known.
- Validated request arrays can be reordered by Laravel when rows have different keys; the request restores input order explicitly.
- A store with no products, or an inactive store, is hidden from customers; admins need a catalogue screen before this scales beyond seed data.

## Update 2026-11-03: admin store management

Admins manage the catalogue under **Stores** (`/admin/stores`): add a store (name, kind, address and map pin, landmark, open for orders), edit it or hide it from customers, and manage its items (add, edit name, description and price, mark sold out). API: `GET|POST /admin/stores`, `GET|PUT /admin/stores/{id}`, `POST /admin/stores/{id}/products`, `PUT /admin/stores/{id}/products/{product}` (the item must belong to that store). Prices are entered in pesos and stored as centavos; bookings keep their own snapshot, so edits never change past orders. Stores are not deleted, only hidden, so order history keeps its store. Item reordering and photos are not built yet.
