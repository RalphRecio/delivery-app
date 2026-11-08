/**
 * Makes the web app installable on phones ("Add to Home Screen") and gives it
 * an offline page.
 *
 * The <head> tags are added here at runtime because Expo's `single` web
 * output serves its own HTML template and never renders app/+html.tsx (that
 * file only applies to `static` output). Each tag is skipped when the page
 * already has it, so a static build with the tags in the template is a no-op.
 *
 * Service workers need a secure context: https, or http on localhost. The
 * dev tunnel qualifies; a plain LAN address does not, and the browser then
 * ignores the registration (the app itself still works).
 */
const MANIFEST_URL = '/manifest.webmanifest';
const SERVICE_WORKER_URL = '/sw.js';
const THEME_COLOR = '#2E9B4F';
const APP_TITLE = 'Pasuyo';

const META_TAGS: [name: string, content: string][] = [
  ['theme-color', THEME_COLOR],
  ['application-name', 'Pasuyo Parang'],
  ['mobile-web-app-capable', 'yes'],
  ['apple-mobile-web-app-capable', 'yes'],
  ['apple-mobile-web-app-title', APP_TITLE],
  ['apple-mobile-web-app-status-bar-style', 'default'],
];

const LINK_TAGS: { rel: string; href: string; sizes?: string; type?: string }[] = [
  { rel: 'manifest', href: MANIFEST_URL },
  { rel: 'icon', href: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png', sizes: '180x180' },
];

export function setupPwa(): void {
  if (typeof document === 'undefined') {
    return;
  }

  addInstallMetadata(document);
  registerServiceWorker();
}

function addInstallMetadata(doc: Document): void {
  for (const [name, content] of META_TAGS) {
    if (doc.querySelector(`meta[name="${name}"]`) === null) {
      const meta = doc.createElement('meta');
      meta.name = name;
      meta.content = content;
      doc.head.appendChild(meta);
    }
  }

  for (const { rel, href, sizes, type } of LINK_TAGS) {
    if (doc.querySelector(`link[rel="${rel}"]`) === null) {
      const link = doc.createElement('link');
      link.rel = rel;
      link.href = href;
      if (sizes !== undefined) {
        link.setAttribute('sizes', sizes);
      }
      if (type !== undefined) {
        link.type = type;
      }
      doc.head.appendChild(link);
    }
  }
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error: unknown) => {
    console.warn('Service worker registration failed', error);
  });
}
