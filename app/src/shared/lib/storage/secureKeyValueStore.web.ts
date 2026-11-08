import type { KeyValueStore } from './KeyValueStore';

/**
 * Web: browsers have no keychain, so localStorage is the best available
 * option (the same place every web app keeps its session). It is still
 * wrapped in the KeyValueStore contract so the rest of the app cannot tell
 * the difference between platforms.
 */
export const secureKeyValueStore: KeyValueStore = {
  get: async (key) => globalThis.localStorage.getItem(key),
  set: async (key, value) => {
    globalThis.localStorage.setItem(key, value);
  },
  remove: async (key) => {
    globalThis.localStorage.removeItem(key);
  },
};
