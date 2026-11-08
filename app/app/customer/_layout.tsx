import { Redirect, Slot, Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PORTALS, resolveAreaAccess } from '@/features/auth';
import { CustomerShell, CustomerTabBar, isTabRoot } from '@/features/customer';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useAuthStore } from '@/stores/authStore';

/**
 * Only a signed-in customer may see this area: signed-out visitors go to
 * /login, other roles to their own home. Wide screens get the top-bar shell; phones get a stack
 * with a bottom tab bar on the four tab screens.
 */
export default function CustomerLayout() {
  const session = useAuthStore((state) => state.session);
  const { isDesktop } = useBreakpoint();
  const pathname = usePathname();

  const access = resolveAreaAccess('customer', pathname, session);

  if (access.kind !== 'allow') {
    // The customer area has no sign-in pages of its own (they are /login and /register).
    return (
      <Redirect href={access.kind === 'redirect' ? access.href : PORTALS.customer.loginHref} />
    );
  }

  if (isDesktop) {
    return (
      <CustomerShell>
        <Slot />
      </CustomerShell>
    );
  }

  return (
    <View style={styles.frame}>
      <Stack screenOptions={{ headerShown: false }} />
      {isTabRoot(pathname) && <CustomerTabBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
});
