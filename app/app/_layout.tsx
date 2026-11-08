import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { queryClient } from '@/config/queryClient';
import { setupPwa } from '@/shared/lib/pwa/setupPwa';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    void hydrate();
    setupPwa();
  }, [hydrate]);

  // Keep the splash screen up until we know whether someone is signed in,
  // otherwise the login screen flashes before the redirect.
  if (!isHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
