import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';
import { Text } from '@/shared/ui';

import { useMakeAdmin } from '../hooks/useAdminQueries';
import { AdminButton } from '../ui';

interface MakeAdminButtonProps {
  userId: number;
  name: string;
}

/**
 * Turns a customer into an admin. Admin rights are broad, so the first press
 * only asks; the second one does it. The customer keeps their password.
 */
export function MakeAdminButton({ userId, name }: MakeAdminButtonProps) {
  const makeAdmin = useMakeAdmin();
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <AdminButton variant="outline" label="Make admin" onPress={() => setIsConfirming(true)} />
    );
  }

  return (
    <View style={styles.confirm}>
      <Text style={styles.question}>Give {name} full admin access?</Text>
      <View style={styles.buttons}>
        <AdminButton
          variant="danger"
          label="Yes, make admin"
          onPress={() => makeAdmin.mutate(userId, { onSuccess: () => setIsConfirming(false) })}
          isLoading={makeAdmin.isPending}
        />
        <AdminButton
          variant="outline"
          label="Cancel"
          onPress={() => {
            makeAdmin.reset();
            setIsConfirming(false);
          }}
          disabled={makeAdmin.isPending}
        />
      </View>
      {makeAdmin.isError && <Text style={styles.error}>{makeAdmin.error.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  confirm: { gap: spacing.xs },
  question: { fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  error: { color: colors.danger },
});
