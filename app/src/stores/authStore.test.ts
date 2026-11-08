import { sessionStorage } from '@/shared/lib/storage/sessionStorage';

import { useAuthStore } from './authStore';

describe('useAuthStore', () => {
  beforeEach(async () => {
    await sessionStorage.clear();
    useAuthStore.setState({ session: null, isHydrated: false });
  });

  it('hydrates to signed out when nothing is stored', async () => {
    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState()).toMatchObject({ session: null, isHydrated: true });
  });

  it('persists a session and restores it on the next hydrate', async () => {
    await useAuthStore.getState().setSession({ token: 'abc', role: 'customer' });
    useAuthStore.setState({ session: null, isHydrated: false });

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().session).toEqual({ token: 'abc', role: 'customer' });
  });

  it('clears the stored session', async () => {
    await useAuthStore.getState().setSession({ token: 'abc', role: 'rider' });
    await useAuthStore.getState().clearSession();

    expect(useAuthStore.getState().session).toBeNull();
    expect(await sessionStorage.load()).toBeNull();
  });
});
