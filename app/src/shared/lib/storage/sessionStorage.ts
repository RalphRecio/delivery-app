import { sessionSchema, type Session } from '@/shared/types/auth';

import { secureKeyValueStore } from './secureKeyValueStore';

const SESSION_KEY = 'auth.session';

/**
 * Persists the signed-in session in platform secure storage.
 * Anything unreadable (corrupt or from an older app version) is treated as
 * "signed out" rather than crashing the app on launch.
 */
export const sessionStorage = {
  async load(): Promise<Session | null> {
    const raw = await secureKeyValueStore.get(SESSION_KEY);

    if (raw === null) {
      return null;
    }

    const parsed = sessionSchema.safeParse(safeJsonParse(raw));

    return parsed.success ? parsed.data : null;
  },

  async save(session: Session): Promise<void> {
    await secureKeyValueStore.set(SESSION_KEY, JSON.stringify(session));
  },

  async clear(): Promise<void> {
    await secureKeyValueStore.remove(SESSION_KEY);
  },
};

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
