import { env } from './env';

/**
 * Web prefers the same-origin path the dev server proxies (EXPO_PUBLIC_WEB_API_URL),
 * so the page and the API share one address wherever the page is opened from.
 */
export const API_BASE_URL = env.webApiUrl ?? env.apiUrl;
