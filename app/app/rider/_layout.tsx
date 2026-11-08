import { Redirect, Slot, Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AuthFrame, resolveAreaAccess } from '@/features/auth';
import {
  isRiderTabRoot,
  RiderTabBar,
  useActiveJob,
  useLiveLocationReporting,
  useRiderHeartbeat,
  useRiderProfile,
} from '@/features/rider';
import { useAuthStore } from '@/stores/authStore';

/**
 * The rider area. /rider/login and /rider/register are open to anyone not
 * signed in as a rider; every other page needs a rider session.
 */
export default function RiderLayout() {
  const session = useAuthStore((state) => state.session);
  const pathname = usePathname();
  const access = resolveAreaAccess('rider', pathname, session);

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

  return (
    <View style={styles.frame}>
      <RiderPresence />
      <Stack screenOptions={{ headerShown: false }} />
      {isRiderTabRoot(pathname) && <RiderTabBar />}
    </View>
  );
}

/**
 * Keeps the rider counted as on duty while the app is open and online, and
 * shares their position with the customer while they have a job.
 */
function RiderPresence() {
  const profile = useRiderProfile();
  const activeJob = useActiveJob();
  useRiderHeartbeat(profile.data?.is_online === true);
  useLiveLocationReporting(activeJob.data !== null && activeJob.data !== undefined);

  return null;
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
});
