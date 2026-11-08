import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';
import { Button, Text } from '@/shared/ui';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLogout } from '../hooks/useLogout';
import { formatPhilippineMobile } from '../lib/phone';

/** Who is signed in, with a sign-out button. Shared by every audience home screen. */
export function CurrentUserCard() {
  const user = useCurrentUser();
  const logout = useLogout();

  return (
    <View style={styles.card}>
      {user.isPending ? (
        <Text variant="caption">Loading your profile…</Text>
      ) : user.isError ? (
        <>
          <Text variant="caption">Could not load your profile. {user.error.message}</Text>
          <Button variant="secondary" label="Retry" onPress={() => void user.refetch()} />
        </>
      ) : (
        <>
          <Text style={styles.name}>{user.data.name}</Text>
          <Text variant="caption">
            {user.data.email} · {formatPhilippineMobile(user.data.phone)} · {user.data.role}
          </Text>
        </>
      )}
      <Button
        variant="secondary"
        label="Sign out"
        onPress={() => logout.mutate()}
        isLoading={logout.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  name: { fontWeight: '600' },
});
