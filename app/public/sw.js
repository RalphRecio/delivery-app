/*
 * Service worker for the installed (PWA) build. It does not cache the app:
 * every request goes to the network, so a new deploy is picked up on the next
 * load and the Metro dev server keeps working. Two jobs: show offline.html
 * instead of the browser's error page when a navigation fails, and show web
 * push notifications from the API (even with the app closed) and open the
 * right screen when one is tapped.
 */
const OFFLINE_CACHE = 'pasuyo-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== OFFLINE_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
    ),
  );
});

/* Web push. The API sends { title, body, icon, badge, tag, data: { url } } (PushMessageNotification). */
self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'Pasuyo Parang';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-192.png',
      tag: payload.tag || undefined,
      data: payload.data || {},
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(
    (event.notification.data && event.notification.data.url) || '/',
    self.location.origin,
  ).href;

  // Focus a window that already has the app open and navigate it; otherwise open a new one.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => 'focus' in client);

      if (open) {
        return open
          .focus()
          .then((client) => (client && 'navigate' in client ? client.navigate(url) : client));
      }

      return self.clients.openWindow(url);
    }),
  );
});
