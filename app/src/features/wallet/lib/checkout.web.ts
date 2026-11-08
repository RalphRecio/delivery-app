/** Where PayMongo sends the rider back: this site's status screen. */
export function topupReturnUrl(): string {
  return `${window.location.origin}/rider/wallet/topup-return`;
}

/**
 * Web: go to the checkout in this tab (a new tab opened after a network call
 * is usually blocked as a popup). PayMongo sends the rider back to the
 * return URL, which polls the server for the result.
 */
export async function openCheckout(url: string): Promise<'navigated-away'> {
  window.location.assign(url);

  return 'navigated-away';
}
