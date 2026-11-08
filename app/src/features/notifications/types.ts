/** What the browser gives back from PushManager.subscribe(), as the API wants it. */
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  content_encoding?: 'aes128gcm' | 'aesgcm';
}

export type PushPermission = 'default' | 'granted' | 'denied';

/** Where this browser stands with notifications. */
export type PushStatus =
  | { kind: 'unsupported' }
  | { kind: 'blocked' }
  | { kind: 'off' }
  | { kind: 'on'; endpoint: string };
