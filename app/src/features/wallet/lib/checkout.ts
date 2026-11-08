import * as Linking from 'expo-linking';

/** Where PayMongo sends the rider back: a deep link into the app's status screen. */
export function topupReturnUrl(): string {
  return Linking.createURL('/rider/wallet/topup-return');
}

/**
 * Phones: open the GCash/Maya checkout in the browser. The app keeps running;
 * the status screen polls the server while the rider pays.
 */
export async function openCheckout(url: string): Promise<'opened-elsewhere'> {
  await Linking.openURL(url);

  return 'opened-elsewhere';
}
