/**
 * Feature switches. Flip a value here and the app adapts; no other file needs
 * to know why a feature is on or off.
 */
interface Features {
  /**
   * Pabili store catalogue: pick a store that fits the Pabili (food, pet
   * food, pharmacy and grocery), add items from its menu, then book. Paused
   * and resumed on 2026-11-03 (docs/adr/0013-pause-store-catalogue.md).
   * The typed shopping list stays reachable from the store list either way.
   */
  storeCatalogue: boolean;
  /**
   * Rider wallet: the Wallet tab, top-ups, and the minimum balance to accept
   * jobs. Off for now (docs/adr/0021-wallet-switched-off.md); the server's
   * WALLET_ENABLED must match.
   */
  riderWallet: boolean;
}

export const features: Readonly<Features> = {
  storeCatalogue: true,
  riderWallet: false,
};
