import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { Alert, Button, Text } from '@/shared/ui';

import { usePushNotifications } from '../hooks/usePushNotifications';

/**
 * "Turn on notifications" for this browser. Shown on the profile and rider
 * home; hidden where the browser cannot do push at all (native builds, or a
 * plain http address).
 */
export function PushNotificationsCard() {
  const { status, turnOn, turnOff } = usePushNotifications();

  if (status.data === undefined || status.data.kind === 'unsupported') {
    return null;
  }

  const isOn = status.data.kind === 'on';
  const isBlocked = status.data.kind === 'blocked';
  const error = turnOn.error ?? turnOff.error;

  return (
    <View style={styles.card} accessibilityLabel="Notifications">
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={isOn ? 'notifications' : 'notifications-off-outline'}
            size={22}
            color={colors.primaryDeep}
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>Notifications</Text>
          <Text variant="caption">
            {isBlocked
              ? 'Blocked in your browser settings. Allow notifications for this site to turn them on.'
              : isOn
                ? 'On for this device: booking updates arrive even when the app is closed.'
                : 'Get booking updates on this device even when the app is closed.'}
          </Text>
        </View>
      </View>
      {error !== null && <Alert tone="error" message={error.message} />}
      {!isBlocked &&
        (isOn ? (
          <Button
            variant="secondary"
            label="Turn off"
            onPress={() => turnOff.mutate()}
            isLoading={turnOff.isPending}
          />
        ) : (
          <Button
            icon="notifications-outline"
            label="Turn on notifications"
            onPress={() => turnOn.mutate()}
            isLoading={turnOn.isPending}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.primaryDeep },
});
