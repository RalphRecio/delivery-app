import * as SecureStore from 'expo-secure-store';

import type { KeyValueStore } from './KeyValueStore';

/**
 * iOS and Android: the device keychain / keystore.
 * Metro picks secureKeyValueStore.web.ts on web, where this module does not exist.
 */
export const secureKeyValueStore: KeyValueStore = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};
