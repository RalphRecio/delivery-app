import type { PushStatus, PushSubscriptionInput } from '../types';

/**
 * The browser side of web push: permission, the PushManager subscription on
 * the service worker registered by setupPwa, and the shape the API stores.
 * Everything here needs a secure context (https or localhost).
 */
export const browserPush = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  async getStatus(): Promise<PushStatus> {
    if (!browserPush.isSupported()) {
      return { kind: 'unsupported' };
    }

    if (Notification.permission === 'denied') {
      return { kind: 'blocked' };
    }

    const subscription = await (await navigator.serviceWorker.ready).pushManager.getSubscription();

    return subscription === null
      ? { kind: 'off' }
      : { kind: 'on', endpoint: subscription.endpoint };
  },

  /** Must run from a tap: browsers (iOS especially) only show the permission prompt on a user gesture. */
  async subscribe(vapidPublicKey: string): Promise<PushSubscriptionInput> {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      throw new Error('Notifications were not allowed.');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    return toInput(subscription);
  },

  /** Returns the endpoint that was removed, or null when there was none. */
  async unsubscribe(): Promise<string | null> {
    const subscription = await (await navigator.serviceWorker.ready).pushManager.getSubscription();

    if (subscription === null) {
      return null;
    }

    await subscription.unsubscribe();

    return subscription.endpoint;
  },
};

function toInput(subscription: PushSubscription): PushSubscriptionInput {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (json.endpoint === undefined || p256dh === undefined || auth === undefined) {
    throw new Error('The browser returned an incomplete push subscription.');
  }

  return { endpoint: json.endpoint, keys: { p256dh, auth }, content_encoding: 'aes128gcm' };
}

/** VAPID keys are URL-safe base64; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));

  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }

  return bytes;
}
