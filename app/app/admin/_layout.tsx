import { Redirect, Slot, Stack, usePathname } from 'expo-router';

import { AdminShell } from '@/features/admin';
import { AuthFrame, resolveAreaAccess } from '@/features/auth';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useAuthStore } from '@/stores/authStore';

/**
 * The admin area. /admin/login is open to anyone not signed in as an admin;
 * every other page needs an admin session. On a wide screen the pages render
 * inside the sidebar shell; on a phone they stack like the rest of the app.
 */
export default function AdminLayout() {
  const session = useAuthStore((state) => state.session);
  const pathname = usePathname();
  const { isDesktop } = useBreakpoint();
  const access = resolveAreaAccess('admin', pathname, session);

  if (access.kind === 'redirect') {
    return <Redirect href={access.href} />;
  }

  if (access.kind === 'auth-page') {
    return (
      <AuthFrame>
        <Slot />
      </AuthFrame>
    );
  }

  if (isDesktop) {
    return (
      <AdminShell>
        <Slot />
      </AdminShell>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
