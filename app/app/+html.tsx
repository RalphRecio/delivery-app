import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML for a `static` web build (app.json web.output). Everything here
 * is web-only: the focus ring colour for inputs (browsers default to blue,
 * off-palette), the page background behind the app, and the tags that let
 * phones install the site as an app. The default `single` output and the
 * dev server use Expo's own template instead, so src/shared/lib/pwa adds the
 * same install tags at runtime when they are missing.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#2E9B4F" />
        <meta name="application-name" content="Pasuyo Parang" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Pasuyo" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const GLOBAL_CSS = `
  body { background-color: #F2F8F4; }
  input:focus, textarea:focus { outline: 2px solid #3C8F6E; outline-offset: -1px; }
`;
