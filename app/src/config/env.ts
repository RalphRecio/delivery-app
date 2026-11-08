import { z } from 'zod';

/**
 * Validated at import time so a misconfigured build fails immediately with a
 * clear message instead of failing on the first network call.
 *
 * Each variable must be referenced literally as `process.env.EXPO_PUBLIC_X`,
 * that is how Expo inlines it into the bundle.
 */
const envSchema = z.object({
  /** Absolute API address; used by the native apps, which have no dev-server origin to share. */
  EXPO_PUBLIC_API_URL: z.url(),
  /**
   * Web only, optional: a same-origin path such as "/api/v1" that the dev
   * server proxies to the API (metro.config.js), or an absolute URL.
   */
  EXPO_PUBLIC_WEB_API_URL: z.union([z.string().startsWith('/'), z.url()]).optional(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_WEB_API_URL: process.env.EXPO_PUBLIC_WEB_API_URL,
});

if (!parsed.success) {
  throw new Error(`Invalid app environment:\n${z.prettifyError(parsed.error)}`);
}

export const env = {
  apiUrl: parsed.data.EXPO_PUBLIC_API_URL,
  webApiUrl: parsed.data.EXPO_PUBLIC_WEB_API_URL,
} as const;
