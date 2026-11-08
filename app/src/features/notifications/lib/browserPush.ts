import type { PushStatus, PushSubscriptionInput } from '../types';

/** Native builds would use Expo push tokens instead; until then push is a web feature. */
export const browserPush = {
  isSupported(): boolean {
    return false;
  },

  getStatus(): Promise<PushStatus> {
    return Promise.resolve({ kind: 'unsupported' });
  },

  subscribe(_vapidPublicKey: string): Promise<PushSubscriptionInput> {
    return Promise.reject(new Error('Push notifications are not available in this build.'));
  },

  unsubscribe(): Promise<string | null> {
    return Promise.resolve(null);
  },
};
