import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';
import { formatPhilippineMobile } from '@/features/auth';
import { Badge, Button, Text } from '@/shared/ui';

import { useSetUserActivation } from '../hooks/useAdminQueries';
import type { AdminRider, AdminUser } from '../types';

import { MakeAdminButton } from './MakeAdminButton';

interface UserRowProps {
  user: AdminUser | AdminRider;
  /** The signed-in admin cannot deactivate themselves. */
  isSelf: boolean;
}

export function UserRow({ user, isSelf }: UserRowProps) {
  const activation = useSetUserActivation();
  const rider = 'is_online' in user ? user : null;

  return (
    <View style={styles.row} accessibilityLabel={`User ${user.phone}`}>
      <View style={styles.text}>
        <Text style={styles.name}>{user.name ?? 'No name yet'}</Text>
        <Text variant="caption">
          {formatPhilippineMobile(user.phone)} · {user.role}
        </Text>
        <View style={styles.badges}>
          {!user.is_active && <Badge label="Deactivated" tone="danger" />}
          {rider !== null && user.is_active && (
            <Badge
              label={rider.is_online ? 'Online' : 'Offline'}
              tone={rider.is_online ? 'success' : 'neutral'}
            />
          )}
          {rider?.active_job_reference !== undefined && (
            <Badge label={`On ${rider.active_job_reference}`} tone="info" />
          )}
        </View>
      </View>
      {!isSelf && (
        <View style={styles.actions}>
          <Button
            variant="secondary"
            label={user.is_active ? 'Deactivate' : 'Reactivate'}
            onPress={() => activation.mutate({ id: user.id, isActive: !user.is_active })}
            isLoading={activation.isPending}
          />
          {user.role === 'customer' && user.is_active && (
            <MakeAdminButton userId={user.id} name={user.name ?? user.phone} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { flex: 1, gap: spacing.xs },
  name: { fontWeight: '600' },
  badges: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  actions: { gap: spacing.xs, alignItems: 'flex-end' },
});
