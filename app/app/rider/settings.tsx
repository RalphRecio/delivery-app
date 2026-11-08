import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, fontSize, spacing } from '@/config/theme';
import { CurrentUserCard } from '@/features/auth';
import { PushNotificationsCard } from '@/features/notifications';
import { LocationPanel, useRiderProfile, useUpdateLocation } from '@/features/rider';
import { Alert, Button, Screen, ScreenHeader, Text } from '@/shared/ui';

export default function RiderSettingsScreen() {
  const profile = useRiderProfile();
  const updateLocation = useUpdateLocation();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Settings" subtitle="Location, notifications and your account." />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {profile.isPending ? (
            <Text variant="caption">Loading your profile…</Text>
          ) : profile.isError ? (
            <>
              <Alert tone="error" message={profile.error.message} />
              <Button variant="secondary" label="Retry" onPress={() => void profile.refetch()} />
            </>
          ) : (
            <LocationPanel
              profile={profile.data}
              onSubmit={(location) => updateLocation.mutate(location)}
              isSaving={updateLocation.isPending}
              saveError={updateLocation.error?.message}
            />
          )}
        </View>

        {/* Renders nothing where the browser cannot do push, so the heading lives inside it. */}
        <PushNotificationsCard />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <CurrentUserCard />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primaryDeep },
});
