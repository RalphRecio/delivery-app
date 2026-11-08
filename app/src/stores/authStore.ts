import { create } from 'zustand';

import { sessionStorage } from '@/shared/lib/storage/sessionStorage';
import type { Session } from '@/shared/types/auth';

interface AuthState {
  /** null while signed out. */
  session: Session | null;
  /** false until the stored session has been read once at app start. */
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: Session) => Promise<void>;
  clearSession: () => Promise<void>;
}

/**
 * Client-only state: who is signed in. Profile data and everything else that
 * comes from the server belongs in the query cache, not here.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  isHydrated: false,

  hydrate: async () => {
    const session = await sessionStorage.load();
    set({ session, isHydrated: true });
  },

  setSession: async (session) => {
    await sessionStorage.save(session);
    set({ session });
  },

  clearSession: async () => {
    await sessionStorage.clear();
    set({ session: null });
  },
}));
